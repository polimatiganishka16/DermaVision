import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Info,
  Microscope,
  Sparkles,
  Sun,
  Upload,
  X,
} from "lucide-react";

import GradCAM from "../components/GradCAM";
import ResultsPanel from "../components/ResultsPanel";
import SkincareGuidance from "../components/SkincareGuidance";

import { API_URL } from "../config";
import {
  MAX_FILE_MB,
  findClassName,
  validateImageFile,
} from "../utils/analysis";

/* Shown in the right-hand column before (and while) there are results. */
function ResultsPlaceholder({ loading }) {
  return (
    <section className="card results-empty" aria-live="polite">
      <div className="results-empty-icon">
        {loading ? (
          <span className="spinner spinner-dark"></span>
        ) : (
          <Microscope size={26} />
        )}
      </div>

      <h3>{loading ? "Analyzing your image…" : "Your results will appear here"}</h3>

      <p>
        {loading
          ? "Running the quality check, the model and the visual explanation."
          : "Upload an image to see the model prediction, other possibilities, condition information and a visual explanation."}
      </p>

      <p className="results-empty-note">
        <Info size={14} />
        Educational information only. Not a medical diagnosis.
      </p>
    </section>
  );
}

export default function Analyze() {
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);
  const dragDepth = useRef(0);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  /* Free the browser's object URL when the preview changes or the page unmounts. */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* On narrow screens the results sit below the upload card: bring them into view. */
  useEffect(() => {
    if (!result) return;

    if (window.matchMedia("(max-width: 1100px)").matches) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const selectFile = (file) => {
    const problem = validateImageFile(file);

    if (problem) {
      setError(problem);
      return;
    }

    setSelectedFile(file);
    setError("");
    setResult(null);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    /* Reset so choosing the same file again still fires onChange. */
    event.target.value = "";

    if (file) selectFile(file);
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  /* ---------- drag and drop ---------- */

  const handleDragEnter = (event) => {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);

    if (loading) return;

    const file = event.dataTransfer?.files?.[0];

    if (file) selectFile(file);
  };

  /* ---------- analysis ---------- */

  const handleAnalyze = async () => {
    if (loading) return;

    if (!selectedFile) {
      setError("Please select a skin image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = `API request failed with status ${response.status}`;

        try {
          const errorData = await response.json();

          if (typeof errorData?.detail === "string") {
            message = errorData.detail;
          }
        } catch {
          // Keep default error message
        }

        throw new Error(message);
      }

      const data = await response.json();

      console.log("DERMAVISION API RESULT:", data);

      if (!findClassName(data?.prediction)) {
        console.warn(
          "PREDICTION LABEL: no class-name field found. prediction keys:",
          Object.keys(data?.prediction || {})
        );
      }

      if (data?.success === false) {
        throw new Error(
          data.error || data.message || "The analysis could not be completed."
        );
      }

      /*
        Backend structure:

        {
          success: true,
          image_quality: {...},
          prediction: {...},
          top3_predictions: [...],
          assessment: {...},
          explainability: {
             gradcam_available: true,
             heatmap_base64: "...",
             overlay_base64: "...",
             target_class: "..."
          },
          medical_information: {...},
          triage: {...},
          disclaimer: "..."
        }
      */

      const explainability =
        data?.explainability ||
        data?.gradcam ||
        data?.explainable_ai ||
        null;

      const medical =
        data?.medical_information ||
        data?.medical_result ||
        data?.medical ||
        null;

      console.log("EXPLAINABILITY RESULT:", explainability);
      console.log("MEDICAL RESULT:", medical);

      setResult({
        ...data,
        explainability,
        medical_information: medical,
      });
    } catch (err) {
      console.error("DERMAVISION ANALYSIS ERROR:", err);

      if (err instanceof TypeError) {
        /* fetch() rejects with a TypeError when the server cannot be reached. */
        setError(
          `Could not reach the DermaVision backend at ${API_URL}. Make sure it is running (uvicorn backend.api:app --reload) and try again.`
        );
      } else {
        setError(
          err?.message ||
            "Unable to analyze the image. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* Remove the image and any results: back to a clean start. */
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
  };

  const explainability =
    result?.explainability ||
    result?.gradcam ||
    result?.explainable_ai ||
    null;

  return (
    <div className="page-container">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">AI SKIN ANALYSIS</div>

          <h1>Analyze your skin image</h1>

          <p>
            Upload an image to receive an AI-generated prediction, visual
            explanation, and educational information.
          </p>
        </div>
      </div>

      <div className="analyze-layout">
        {/* LEFT: IMAGE */}
        <section
          className={`card upload-card area-input ${isDragging ? "is-dragging" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="section-heading">
            <div className="section-icon">
              <Upload size={19} />
            </div>

            <div>
              <div className="eyebrow">IMAGE INPUT</div>
              <h2>Upload a skin image</h2>
              <p>Use a clear, well-lit image focused on the affected skin area.</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden-input"
          />

          {!previewUrl ? (
            <button
              type="button"
              className="upload-dropzone"
              onClick={handleChooseImage}
            >
              <div className="upload-icon">
                <Upload size={28} />
              </div>

              <h3>{isDragging ? "Drop the image here" : "Drag and drop an image"}</h3>

              <p>
                or click to browse · JPG, PNG or WebP · up to {MAX_FILE_MB} MB
              </p>

              <span className="upload-button">Browse image</span>
            </button>
          ) : (
            <div className="preview-block">
              <div className="preview-frame">
                <img src={previewUrl} alt="Selected skin image" />

                <button
                  type="button"
                  className="preview-remove"
                  onClick={handleReset}
                  disabled={loading}
                  aria-label="Remove image"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="file-status">
                <CheckCircle2 size={18} />

                <div>
                  <strong>{result ? "Image analyzed" : "Image selected"}</strong>
                  <span>{selectedFile?.name}</span>
                </div>
              </div>

              {!result && (
                <button
                  type="button"
                  className="button primary-button button-block"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={17} />
                      Analyze image
                    </>
                  )}
                </button>
              )}

              {loading && (
                <p className="loading-note" role="status">
                  Running the model. This can take a few seconds.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="error-box" role="alert">
              <AlertCircle size={18} />

              <div>
                <strong>{previewUrl ? "Analysis failed" : "Image not accepted"}</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!result && (
          <ul className="upload-tips">
            <li>
              <Sun size={16} />
              <span>Use good lighting</span>
            </li>
            <li>
              <Camera size={16} />
              <span>Close-up of the affected area</span>
            </li>
            <li>
              <CheckCircle2 size={16} />
              <span>Keep the image clear and in focus</span>
            </li>
          </ul>
          )}
        </section>

        {/* RIGHT: RESULTS */}
        <div className="area-results" ref={resultsRef}>
          {result ? (
            <ResultsPanel result={result} onReset={handleReset} />
          ) : (
            <ResultsPlaceholder loading={loading} />
          )}
        </div>

        {/* LEFT, UNDER THE IMAGE: VISUAL EXPLANATION */}
        {result && (
          <div className="area-visual">
            <GradCAM data={explainability} />
            <SkincareGuidance />
          </div>
        )}
      </div>
    </div>
  );
}
