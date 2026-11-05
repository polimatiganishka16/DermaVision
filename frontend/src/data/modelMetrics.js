/*
  Real development/evaluation figures for the trained model, as documented
  for this project. These are research/development metrics, not a
  clinical validation, and the UI must keep saying so.
*/

export const MODEL_INFO = {
  architecture: "EfficientNet-B4",
  pretrained: "ImageNet-pretrained backbone",
  inputSize: "380 × 380",
  training: [
    "Soft class weights",
    "Reduced data augmentation",
    "Discriminative learning rates",
    "AdamW optimizer",
    "ReduceLROnPlateau scheduler",
    "Early stopping",
  ],
};

export const DATASET_INFO = {
  source: "Kaggle: 20 Skin Diseases Dataset",
  classes: 19,
  note: "19 classes were used after cleaning, from an original 20-class dataset.",
  splits: [
    { label: "Train", value: 1988 },
    { label: "Validation", value: 497 },
    { label: "Test", value: 510 },
  ],
  dedupe: "Exact duplicate images were removed. Train/validation/test exact-hash overlap: 0.",
  caveat: "The dataset has no patient IDs, so patient-level independence between splits cannot be guaranteed.",
};

export const VALIDATION_METRICS = [
  { label: "Accuracy", value: "47.48%" },
  { label: "Balanced accuracy", value: "22.52%" },
  { label: "Macro-F1", value: "21.69%" },
];

export const TEST_METRICS = {
  sampleSize: 510,
  rows: [
    { label: "Accuracy", value: "33.33%" },
    { label: "Balanced accuracy", value: "17.61%" },
    { label: "Macro-F1", value: "16.32%" },
    { label: "Top-3 accuracy", value: "56.67%" },
    { label: "Top-5 accuracy", value: "71.57%" },
  ],
};

export const CALIBRATION_METRICS = {
  temperature: 0.6975,
  rows: [
    { label: "Brier score", before: "0.7029", after: "0.6753" },
    { label: "Expected calibration error (ECE)", before: "0.1442", after: "0.0516" },
  ],
};

export const OOD_METRICS = {
  auroc: "0.9091",
  note: "Out-of-distribution detection experiment: how well the model's uncertainty separates in-distribution skin images from clearly unrelated images.",
};

export const UNCERTAINTY_THRESHOLDS = {
  confidenceThreshold: 0.4,
  uncertaintyThreshold: 0.75,
  note: "A result is flagged UNCERTAIN if uncertainty is 0.75 or higher, or confidence is below 40%. These are development settings, not clinically validated cut-offs.",
};
