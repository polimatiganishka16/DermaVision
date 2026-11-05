from __future__ import annotations

import base64
import io
import json
import math
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image

import torch
import torch.nn as nn
from torchvision import models, transforms


# ============================================================
# DERMA VISION - COMPLETE BACKEND
# ============================================================

PROJECT_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_DIR / "models"

MODEL_PATH = MODELS_DIR / "efficientnet_b4_exp2_best.pth"
CONFIG_PATH = MODELS_DIR / "model_config.json"
MEDICAL_KB_PATH = MODELS_DIR / "medical_knowledge_base.json"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ============================================================
# CONFIG
# ============================================================

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

IMAGE_SIZE = int(CONFIG.get("image_size", 380))
NUM_CLASSES = int(CONFIG.get("num_classes", 19))
CLASS_NAMES = list(CONFIG["classes"])

TEMPERATURE = float(CONFIG.get("temperature", 0.6975))
CONFIDENCE_THRESHOLD = float(CONFIG.get("confidence_threshold", 0.40))
UNCERTAINTY_THRESHOLD = float(CONFIG.get("uncertainty_threshold", 0.75))

if len(CLASS_NAMES) != NUM_CLASSES:
    raise ValueError(
        f"Config mismatch: {len(CLASS_NAMES)} classes found, "
        f"but num_classes={NUM_CLASSES}"
    )


# ============================================================
# TRANSFORM
# ============================================================

VAL_TRANSFORM = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


# ============================================================
# MODEL
# ============================================================

def build_model() -> nn.Module:
    model = models.efficientnet_b4(weights=None)
    model.classifier[1] = nn.Linear(1792, NUM_CLASSES)

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
    )

    if isinstance(checkpoint, dict):
        if "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
        elif "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
        else:
            state_dict = checkpoint
    else:
        state_dict = checkpoint

    cleaned_state_dict = {}

    for key, value in state_dict.items():
        if key.startswith("module."):
            key = key[7:]
        cleaned_state_dict[key] = value

    missing, unexpected = model.load_state_dict(
        cleaned_state_dict,
        strict=False,
    )

    if missing:
        raise RuntimeError(
            f"Missing model checkpoint keys: {missing[:10]}"
        )

    if unexpected:
        print(
            "Warning: unexpected checkpoint keys:",
            unexpected[:10],
        )

    model.to(DEVICE)
    model.eval()

    return model


model = build_model()


# ============================================================
# MEDICAL KNOWLEDGE BASE
# ============================================================

with open(MEDICAL_KB_PATH, "r", encoding="utf-8") as f:
    MEDICAL_KB = json.load(f)


# ============================================================
# IMAGE QUALITY
# ============================================================

def check_image_quality(image: Image.Image) -> dict[str, Any]:
    image = image.convert("RGB")

    arr = np.asarray(image)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

    height, width = arr.shape[:2]

    blur_score = float(
        cv2.Laplacian(gray, cv2.CV_64F).var()
    )

    brightness = float(gray.mean())

    issues = []

    if width < 224 or height < 224:
        issues.append("Image resolution is low.")

    if blur_score < 40:
        issues.append("Image may be blurry.")

    if brightness < 25:
        issues.append("Image may be too dark.")

    if brightness > 235:
        issues.append("Image may be overexposed.")

    score = 1.0

    if min(width, height) < 224:
        score -= 0.30

    if blur_score < 40:
        score -= 0.20

    if brightness < 25 or brightness > 235:
        score -= 0.15

    score = float(np.clip(score, 0.0, 1.0))

    if not issues:
        status = "PASS"
    elif score < 0.50:
        status = "REJECT"
    else:
        status = "REVIEW"

    return {
        "status": status,
        "quality_score": score,
        "issues": issues,
        "width": width,
        "height": height,
        "blur_score": blur_score,
        "brightness": brightness,
    }


# ============================================================
# UNCERTAINTY
# ============================================================

def entropy(probabilities: torch.Tensor) -> float:
    p = probabilities.clamp_min(1e-12)

    return float(
        -(p * torch.log(p)).sum().item()
    )


def normalized_entropy(probabilities: torch.Tensor) -> float:
    return float(
        entropy(probabilities)
        / math.log(len(probabilities))
    )


def calculate_uncertainty(
    confidence: float,
    normalized_ent: float,
) -> float:
    return float(
        (
            normalized_ent
            + (1.0 - confidence)
        )
        / 2.0
    )


# ============================================================
# SINGLE IMAGE PREDICTION
# ============================================================

@torch.inference_mode()
def predict_single_image(
    image_path: str | Path,
) -> dict[str, Any]:

    image = Image.open(image_path).convert("RGB")

    input_tensor = (
        VAL_TRANSFORM(image)
        .unsqueeze(0)
        .to(DEVICE)
    )

    logits = model(input_tensor)

    # Temperature calibration from the Colab experiment.
    calibrated_logits = logits / TEMPERATURE

    probabilities = torch.softmax(
        calibrated_logits,
        dim=1,
    )[0]

    confidence, predicted_index = torch.max(
        probabilities,
        dim=0,
    )

    confidence = float(confidence.item())
    predicted_index = int(predicted_index.item())

    ent = entropy(probabilities)
    norm_ent = normalized_entropy(probabilities)

    uncertainty = calculate_uncertainty(
        confidence,
        norm_ent,
    )

    top_k = min(5, NUM_CLASSES)

    top_probs, top_indices = torch.topk(
        probabilities,
        k=top_k,
    )

    top_predictions = []

    for probability, index in zip(
        top_probs.tolist(),
        top_indices.tolist(),
    ):
        top_predictions.append({
            "class": CLASS_NAMES[index],
            "class_index": int(index),
            "confidence": float(probability),
            "confidence_percentage": float(
                probability * 100
            ),
        })

    return {
        "predicted_class": CLASS_NAMES[predicted_index],
        "predicted_class_index": predicted_index,
        "confidence": confidence,
        "confidence_percentage": confidence * 100,
        "entropy": ent,
        "normalized_entropy": norm_ent,
        "uncertainty": uncertainty,
        "top_predictions": top_predictions,
        "all_probabilities": probabilities.cpu().numpy(),
        "image": image,
        "input_tensor": input_tensor,
    }


# ============================================================
# ASSESSMENT
# ============================================================

def assess_prediction(
    prediction: dict[str, Any],
) -> dict[str, Any]:

    confidence = float(
        prediction["confidence"]
    )

    uncertainty = float(
        prediction["uncertainty"]
    )

    if (
        uncertainty >= UNCERTAINTY_THRESHOLD
        or confidence < CONFIDENCE_THRESHOLD
    ):
        status = "UNCERTAIN"

        message = (
            "The model is not sufficiently confident "
            "in this image. The result should not be "
            "treated as a reliable classification."
        )

    else:
        status = "MODEL_PREDICTION"

        message = (
            "The model produced a prediction above "
            "the development confidence and "
            "uncertainty thresholds."
        )

    explanation = (
        f"The model confidence is "
        f"{confidence * 100:.2f}% and calculated "
        f"uncertainty is {uncertainty:.4f}. "
        "These thresholds are development settings "
        "and are not clinically validated."
    )

    return {
        "status": status,
        "message": message,
        "explanation": explanation,
        "confidence": confidence,
        "uncertainty": uncertainty,
    }


# ============================================================
# GRAD-CAM
#
# This version deliberately does NOT use:
# register_backward_hook()
# register_full_backward_hook()
#
# Instead it:
# 1. registers forward hooks
# 2. stores activation tensors
# 3. calls retain_grad()
# 4. performs one backward pass
# 5. calculates CAM from activation.grad
#
# This is much more reliable for EfficientNet.
# ============================================================

GRADCAM_LAYERS = {
    "features.5": 0.25,
    "features.6": 0.25,
    "features.8": 0.50,
}


def get_module(
    root: nn.Module,
    dotted_name: str,
) -> nn.Module:

    current = root

    for part in dotted_name.split("."):
        current = getattr(current, part)

    return current


def normalize_cam(
    cam: np.ndarray,
) -> np.ndarray:

    cam = np.nan_to_num(
        cam,
        nan=0.0,
        posinf=0.0,
        neginf=0.0,
    )

    cam = np.maximum(
        cam,
        0.0,
    )

    minimum = float(cam.min())
    maximum = float(cam.max())

    if maximum - minimum < 1e-12:
        return np.zeros_like(
            cam,
            dtype=np.float32,
        )

    return (
        (cam - minimum)
        / (maximum - minimum)
    ).astype(np.float32)


def soft_refine_cam(
    cam: np.ndarray,
    percentile: float = 65.0,
    softness: float = 0.15,
) -> np.ndarray:

    cam = normalize_cam(cam)

    threshold = float(
        np.percentile(
            cam,
            percentile,
        )
    )

    scale = max(
        float(softness),
        1e-3,
    )

    soft_mask = 1.0 / (
        1.0
        + np.exp(
            -(cam - threshold)
            / scale
        )
    )

    refined = cam * soft_mask

    return normalize_cam(refined)


def create_cam_overlay(
    image: Image.Image,
    cam: np.ndarray,
    alpha: float = 0.42,
) -> tuple[Image.Image, Image.Image]:

    original = image.convert("RGB")

    original_array = np.asarray(
        original
    )

    cam = cv2.resize(
        cam,
        original.size,
        interpolation=cv2.INTER_LINEAR,
    )

    cam = normalize_cam(cam)

    heat_uint8 = np.uint8(
        cam * 255
    )

    heat_bgr = cv2.applyColorMap(
        heat_uint8,
        cv2.COLORMAP_JET,
    )

    heat_rgb = cv2.cvtColor(
        heat_bgr,
        cv2.COLOR_BGR2RGB,
    )

    overlay = cv2.addWeighted(
        original_array.astype(
            np.uint8
        ),
        1.0 - alpha,
        heat_rgb.astype(
            np.uint8
        ),
        alpha,
        0,
    )

    return (
        Image.fromarray(heat_rgb),
        Image.fromarray(overlay),
    )


def image_to_base64(
    image: Image.Image,
) -> str:

    buffer = io.BytesIO()

    image.save(
        buffer,
        format="PNG",
    )

    return base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")


def generate_cam_for_image(
    image_path: str | Path,
    target_class_index: int | None = None,
) -> dict[str, Any]:

    image = Image.open(
        image_path
    ).convert("RGB")

    input_tensor = (
        VAL_TRANSFORM(image)
        .unsqueeze(0)
        .to(DEVICE)
    )

    activations = {}
    hooks = []

    def make_forward_hook(
        layer_name: str,
    ):

        def hook(
            module,
            inputs,
            output,
        ):

            activation = output

            if isinstance(
                activation,
                (tuple, list),
            ):
                activation = activation[0]

            if not torch.is_grad_enabled():
                raise RuntimeError(
                    "Grad-CAM forward pass was "
                    "executed with gradients disabled."
                )

            activation.retain_grad()

            activations[
                layer_name
            ] = activation

        return hook

    try:

        # ----------------------------------------------------
        # Register hooks
        # ----------------------------------------------------

        for layer_name in GRADCAM_LAYERS:

            layer = get_module(
                model,
                layer_name,
            )

            hooks.append(
                layer.register_forward_hook(
                    make_forward_hook(
                        layer_name
                    )
                )
            )

        # ----------------------------------------------------
        # IMPORTANT:
        # Grad-CAM must NOT be inside inference_mode().
        # ----------------------------------------------------

        model.eval()
        model.zero_grad(
            set_to_none=True
        )

        with torch.enable_grad():

            logits = model(
                input_tensor
            )

            if target_class_index is None:

                target_class_index = int(
                    torch.argmax(
                        logits,
                        dim=1,
                    ).item()
                )

            target_score = logits[
                0,
                target_class_index,
            ]

            target_score.backward()

        # ----------------------------------------------------
        # Build individual layer CAMs
        # ----------------------------------------------------

        layer_cams = []
        layer_details = []

        for (
            layer_name,
            layer_weight,
        ) in GRADCAM_LAYERS.items():

            activation = activations.get(
                layer_name
            )

            if activation is None:
                continue

            if activation.grad is None:
                continue

            gradients = activation.grad

            # Global average pooling over H,W.
            weights = gradients.mean(
                dim=(2, 3),
                keepdim=True,
            )

            cam_tensor = (
                weights * activation
            ).sum(
                dim=1
            )[0]

            cam_tensor = torch.relu(
                cam_tensor
            )

            cam = (
                cam_tensor
                .detach()
                .cpu()
                .numpy()
            )

            cam = normalize_cam(
                cam
            )

            cam = cv2.resize(
                cam,
                (
                    IMAGE_SIZE,
                    IMAGE_SIZE,
                ),
                interpolation=cv2.INTER_LINEAR,
            )

            layer_cams.append(
                (
                    float(layer_weight),
                    cam,
                )
            )

            layer_details.append({
                "layer": layer_name,
                "weight": float(
                    layer_weight
                ),
                "shape": list(
                    activation.shape
                ),
            })

        if not layer_cams:
            raise RuntimeError(
                "No Grad-CAM activation "
                "gradients were produced."
            )

        # ----------------------------------------------------
        # Weighted multi-layer fusion
        # ----------------------------------------------------

        combined = np.zeros_like(
            layer_cams[0][1],
            dtype=np.float32,
        )

        total_weight = 0.0

        for weight, cam in layer_cams:

            combined += (
                weight * cam
            )

            total_weight += weight

        combined /= max(
            total_weight,
            1e-12,
        )

        combined = normalize_cam(
            combined
        )

        # ----------------------------------------------------
        # Soft adaptive refinement
        # ----------------------------------------------------

        refined = soft_refine_cam(
            combined,
            percentile=65.0,
            softness=0.15,
        )

        # ----------------------------------------------------
        # Heatmap + overlay
        # ----------------------------------------------------

        heatmap, overlay = (
            create_cam_overlay(
                image,
                refined,
                alpha=0.42,
            )
        )

        return {
            "available": True,
            "target_class": CLASS_NAMES[
                target_class_index
            ],
            "target_class_index": int(
                target_class_index
            ),
            "layers": layer_details,
            "heatmap": heatmap,
            "overlay": overlay,
            "heatmap_base64": image_to_base64(
                heatmap
            ),
            "overlay_base64": image_to_base64(
                overlay
            ),
            "message": (
                "Grad-CAM highlights image "
                "regions that contributed to "
                "the model prediction. It is "
                "an attribution method, not a "
                "clinical lesion segmentation "
                "or diagnostic proof."
            ),
        }

    except Exception as exc:

        return {
            "available": False,
            "error": (
                f"{type(exc).__name__}: {exc}"
            ),
            "message": (
                "Grad-CAM could not be generated "
                "for this image. The model "
                "prediction can still be displayed."
            ),
        }

    finally:

        for hook in hooks:
            hook.remove()

        model.zero_grad(
            set_to_none=True
        )


# ============================================================
# MEDICAL INFORMATION
# ============================================================

def get_medical_information(
    predicted_class: str,
) -> dict[str, Any]:

    if predicted_class in MEDICAL_KB:
        return MEDICAL_KB[
            predicted_class
        ]

    normalized = (
        predicted_class
        .strip()
        .lower()
    )

    for key, value in MEDICAL_KB.items():

        display_name = str(
            value.get(
                "display_name",
                key,
            )
        ).strip().lower()

        if normalized == display_name:
            return value

    return {
        "display_name": predicted_class,
        "category": "Dataset classification category",
        "description": (
            "This is a broad dataset category. "
            "The model output should not be "
            "interpreted as a confirmed diagnosis."
        ),
        "common_features": [],
        "general_care": [],
        "seek_care": [
            "Seek professional evaluation for "
            "persistent, worsening, painful, "
            "rapidly changing, or otherwise "
            "concerning skin findings."
        ],
        "source": "Medical knowledge base",
        "source_url": "",
    }


# ============================================================
# TRIAGE
# ============================================================

def generate_triage_guidance(
    result: dict[str, Any],
) -> dict[str, Any]:

    quality = result.get(
        "quality",
        {},
    )

    assessment = result.get(
        "assessment",
        {},
    )

    if quality.get(
        "status"
    ) == "REJECT":

        return {
            "level": "REPEAT_IMAGE",
            "title": "Repeat Image",
            "message": (
                "The image quality is not "
                "sufficient for a reliable "
                "model result."
            ),
            "recommendation": (
                "Take another clear, well-lit, "
                "focused image of the affected area."
            ),
        }

    if assessment.get(
        "status"
    ) == "UNCERTAIN":

        return {
            "level": "CLINICAL_REVIEW",
            "title": "Clinical Review",
            "message": (
                "The model result is uncertain "
                "and should not be relied upon "
                "as a diagnosis."
            ),
            "recommendation": (
                "Consider evaluation by a qualified "
                "healthcare professional, particularly "
                "if the skin problem is persistent, "
                "worsening, painful, recurrent, or "
                "otherwise concerning."
            ),
        }

    return {
        "level": "GENERAL_GUIDANCE",
        "title": "General Guidance",
        "message": (
            "The model produced a prediction "
            "within the development thresholds."
        ),
        "recommendation": (
            "Use this result as educational "
            "decision-support information, "
            "not as a confirmed medical diagnosis."
        ),
    }


# ============================================================
# FINAL PIPELINE
# ============================================================

def add_top3_to_final_result(
    result: dict[str, Any],
) -> dict[str, Any]:

    prediction = result.get(
        "prediction"
    )

    if prediction:
        result[
            "top3_predictions"
        ] = prediction[
            "top_predictions"
        ][:3]
    else:
        result[
            "top3_predictions"
        ] = []

    return result


def final_skin_analysis(
    image_path: str | Path,
) -> dict[str, Any]:

    image_path = Path(
        image_path
    )

    if not image_path.exists():

        return {
            "success": False,
            "error": (
                f"Image not found: "
                f"{image_path}"
            ),
        }

    image = Image.open(
        image_path
    ).convert("RGB")

    quality = check_image_quality(
        image
    )

    if quality[
        "status"
    ] == "REJECT":

        return {
            "success": True,
            "quality": quality,
            "prediction": None,
            "assessment": {
                "status": "UNCERTAIN",
                "message": (
                    "Image quality is "
                    "insufficient for model analysis."
                ),
            },
            "gradcam": {
                "available": False,
            },
        }

    prediction = predict_single_image(
        image_path
    )

    assessment = assess_prediction(
        prediction
    )

    # Grad-CAM uses the predicted class.
    gradcam = generate_cam_for_image(
        image_path,
        target_class_index=prediction[
            "predicted_class_index"
        ],
    )

    return {
        "success": True,
        "quality": quality,
        "prediction": prediction,
        "assessment": assessment,
        "gradcam": gradcam,
    }


def final_skin_analysis_with_medical_info(
    image_path: str | Path,
) -> dict[str, Any]:

    result = final_skin_analysis(
        image_path
    )

    if not result.get(
        "success",
        False,
    ):
        return result

    prediction = result.get(
        "prediction"
    )

    if prediction:

        result[
            "medical_information"
        ] = get_medical_information(
            prediction[
                "predicted_class"
            ]
        )

    else:
        result[
            "medical_information"
        ] = None

    add_top3_to_final_result(
        result
    )

    result[
        "triage"
    ] = generate_triage_guidance(
        result
    )

    result[
        "disclaimer"
    ] = (
        "This system provides an AI model "
        "prediction and general educational "
        "information. It is not a confirmed "
        "medical diagnosis."
    )

    return result


# ============================================================
# UI RESULT
# ============================================================

def create_ui_result(
    final_result: dict[str, Any],
) -> dict[str, Any]:

    quality = final_result.get(
        "quality",
        {},
    )

    prediction = final_result.get(
        "prediction"
    ) or {}

    assessment = final_result.get(
        "assessment",
        {},
    )

    medical = final_result.get(
        "medical_information"
    ) or {}

    triage = final_result.get(
        "triage",
        {},
    )

    gradcam = final_result.get(
        "gradcam",
        {},
    )

    return {
        "success": bool(
            final_result.get(
                "success",
                False,
            )
        ),

        "image_quality": {
            "status": quality.get(
                "status"
            ),
            "score": quality.get(
                "quality_score"
            ),
            "issues": quality.get(
                "issues",
                [],
            ),
            "width": quality.get(
                "width"
            ),
            "height": quality.get(
                "height"
            ),
            "blur_score": quality.get(
                "blur_score"
            ),
            "brightness": quality.get(
                "brightness"
            ),
        },

        "prediction": {
            "class": prediction.get(
                "predicted_class"
            ),
            "class_index": prediction.get(
                "predicted_class_index"
            ),
            "confidence": prediction.get(
                "confidence"
            ),
            "confidence_percent": prediction.get(
                "confidence_percentage"
            ),
        },

        "top3_predictions": final_result.get(
            "top3_predictions",
            [],
        ),

        "assessment": {
            "status": assessment.get(
                "status"
            ),
            "message": assessment.get(
                "message"
            ),
            "explanation": assessment.get(
                "explanation"
            ),
            "confidence": assessment.get(
                "confidence"
            ),
            "uncertainty": assessment.get(
                "uncertainty"
            ),
        },

        "explainability": {
            "gradcam_available": bool(
                gradcam.get(
                    "available",
                    False,
                )
            ),
            "target_class": gradcam.get(
                "target_class"
            ),
            "message": gradcam.get(
                "message"
            ),
            "overlay_base64": gradcam.get(
                "overlay_base64"
            ),
            "heatmap_base64": gradcam.get(
                "heatmap_base64"
            ),
            "layers": gradcam.get(
                "layers",
                [],
            ),
            "error": gradcam.get(
                "error"
            ),
        },

        "medical_information": {
            "condition": medical.get(
                "display_name"
            ),
            "category": medical.get(
                "category"
            ),
            "description": medical.get(
                "description"
            ),
            "common_features": medical.get(
                "common_features",
                [],
            ),
            "general_care": medical.get(
                "general_care",
                [],
            ),
            "seek_care": medical.get(
                "seek_care",
                [],
            ),
            "source": medical.get(
                "source"
            ),
            "source_url": medical.get(
                "source_url"
            ),
        },

        "triage": triage,

        "disclaimer": final_result.get(
            "disclaimer",
            "This system provides an AI model "
            "prediction and general educational "
            "information. It is not a confirmed "
            "medical diagnosis.",
        ),
    }


# ============================================================
# BACKEND TEST
# ============================================================

def run_backend_test(
    image_path: str | Path,
) -> None:

    print("=" * 60)
    print("RUNNING DERMA VISION BACKEND TEST")
    print("=" * 60)

    image_path = Path(
        image_path
    )

    print("\n[1] Image:")
    print(image_path)

    print("\n[2] Running analysis...")

    result = (
        final_skin_analysis_with_medical_info(
            image_path
        )
    )

    if not result.get(
        "success",
        False,
    ):

        print(
            "ERROR:",
            result.get(
                "error"
            ),
        )

        return

    quality = result[
        "quality"
    ]

    prediction = result[
        "prediction"
    ]

    assessment = result[
        "assessment"
    ]

    gradcam = result[
        "gradcam"
    ]

    medical = result[
        "medical_information"
    ]

    triage = result[
        "triage"
    ]

    print("\n[3] IMAGE QUALITY")
    print(
        "Status:",
        quality["status"],
    )

    print(
        "Score:",
        quality["quality_score"],
    )

    print("\n[4] MODEL PREDICTION")
    print(
        "Class:",
        prediction[
            "predicted_class"
        ],
    )

    print(
        f"Confidence: "
        f"{prediction['confidence_percentage']:.2f}%"
    )

    print("\n[5] ASSESSMENT")
    print(
        "Status:",
        assessment["status"],
    )

    print(
        f"Uncertainty: "
        f"{assessment['uncertainty']:.4f}"
    )

    print("\n[6] TOP-3 PREDICTIONS")

    for number, item in enumerate(
        result[
            "top3_predictions"
        ],
        1,
    ):

        print(
            f"{number}. "
            f"{item['class']} - "
            f"{item['confidence_percentage']:.2f}%"
        )

    print("\n[7] GRAD-CAM")

    print(
        "Available:",
        gradcam.get(
            "available"
        ),
    )

    if gradcam.get(
        "available"
    ):

        print(
            "Target:",
            gradcam.get(
                "target_class"
            ),
        )

        print(
            "Layers:",
            ", ".join(
                x["layer"]
                for x in gradcam.get(
                    "layers",
                    [],
                )
            ),
        )

        print(
            "Overlay generated: YES"
        )

    else:

        print(
            "Error:",
            gradcam.get(
                "error"
            ),
        )

    print("\n[8] MEDICAL INFORMATION")

    print(
        "Condition:",
        medical.get(
            "display_name"
        ),
    )

    print("\n[9] TRIAGE")

    print(
        "Level:",
        triage.get(
            "level"
        ),
    )

    print(
        "Title:",
        triage.get(
            "title"
        ),
    )

    print("\n[10] BACKEND TEST COMPLETE")
    print("=" * 60)


# ============================================================
# STARTUP
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("DERMA VISION BACKEND")
    print("=" * 60)

    print(
        "Project directory:",
        PROJECT_DIR,
    )

    print(
        "Model:",
        MODEL_PATH,
    )

    print(
        "Config:",
        CONFIG_PATH,
    )

    print(
        "Medical KB:",
        MEDICAL_KB_PATH,
    )

    print(
        "Device:",
        DEVICE,
    )

    print(
        "Model loaded successfully."
    )

    print(
        "Model: EfficientNet"
    )

    print(
        "Number of classes:",
        NUM_CLASSES,
    )

    print(
        "Image size:",
        IMAGE_SIZE,
    )

    print(
        "Temperature:",
        TEMPERATURE,
    )

    print(
        "Confidence threshold:",
        CONFIDENCE_THRESHOLD,
    )

    print(
        "Uncertainty threshold:",
        UNCERTAINTY_THRESHOLD,
    )

    print("=" * 60)

    print(
        "\nDermaVision backend imported successfully."
    )

    print(
        "To test an image, run:"
    )

    print(
        "from backend import run_backend_test"
    )

    print(
        "run_backend_test('test_images/test.jpg')"
    )
