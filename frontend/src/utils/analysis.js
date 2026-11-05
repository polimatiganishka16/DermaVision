/*
  Pure helpers for reading and presenting an /analyze API result.
  No JSX here, so the same logic can be used by the Analyze page, the
  results panel, and later the History / Assessment / Progress pages.
*/

/* Client-side upload guard. Change MAX_FILE_MB if you want a different limit. */
export const MAX_FILE_MB = 10;
export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function validateImageFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Unsupported file type. Please upload a JPG, PNG or WebP image.";
  }

  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `This image is larger than ${MAX_FILE_MB} MB. Please choose a smaller file.`;
  }

  return "";
}

/* ---------- Class names ---------- */

/* Known field names first; if none match, fall back to a sensible guess so the
   UI never shows "Unknown" just because a field was named differently. */
const NAME_KEYS = [
  "display_name",
  "class_name",
  "label",
  "condition",
  "name",
  "predicted_class",
  "predicted_label",
  "class",
  "category_name",
  "disease",
  "raw_class_name",
  "title",
];

export function prettifyName(text) {
  const trimmed = text.trim();

  return trimmed.includes("_") && !trimmed.includes(" ")
    ? trimmed.replace(/_/g, " ")
    : trimmed;
}

export function findClassName(item) {
  if (!item || typeof item !== "object") return "";

  for (const key of NAME_KEYS) {
    const value = item[key];

    if (typeof value === "string" && value.trim() && !/^\d+$/.test(value.trim())) {
      return prettifyName(value);
    }
  }

  const skip = /url|src|base64|colou?r|status|message|note|source|hint|level|method|unit/i;

  const candidates = Object.entries(item).filter(
    ([key, value]) =>
      typeof value === "string" &&
      value.trim() &&
      value.length <= 120 &&
      !/^[\d.\s%-]+$/.test(value) &&
      !skip.test(key)
  );

  const preferred = candidates.find(([key]) =>
    /name|label|class|condition|disease|categor|title/i.test(key)
  );

  const chosen =
    preferred || [...candidates].sort((a, b) => b[1].length - a[1].length)[0];

  return chosen ? prettifyName(chosen[1]) : "";
}

/* 0-1 fractions become percentages; values above 1 are assumed to be
   percentages already. */
export function toPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return number <= 1 ? number * 100 : number;
}

export function getConfidence(prediction) {
  if (!prediction) return 0;

  return toPercent(
    prediction.confidence ??
      prediction.probability ??
      prediction.score ??
      0
  );
}

export function formatConfidence(value) {
  return `${Number(value).toFixed(1)}%`;
}

export function getTopPrediction(result) {
  if (!result?.prediction) return null;

  return result.prediction;
}

export function getTopPredictions(result) {
  if (!Array.isArray(result?.top3_predictions)) {
    return [];
  }

  return result.top3_predictions;
}

export function getMedical(result) {
  return (
    result?.medical_information ||
    result?.medical_result ||
    result?.medical ||
    null
  );
}

export function getTriage(result) {
  return result?.triage || null;
}

/* ---------- Assessment: confident vs uncertain ---------- */

export function getAssessmentInfo(assessment) {
  if (!assessment) return null;

  const raw = String(
    assessment.status ?? assessment.label ?? assessment.level ?? ""
  ).trim();

  let kind = "unknown";

  if (
    assessment.is_uncertain === true ||
    /uncertain|not confident|low[\s-]?confidence/i.test(raw)
  ) {
    kind = "uncertain";
  } else if (assessment.is_uncertain === false || /confident/i.test(raw)) {
    kind = "confident";
  }

  const uncertaintyValue =
    assessment.uncertainty ?? assessment.uncertainty_score;

  return {
    kind,
    raw,
    uncertaintyPct:
      typeof uncertaintyValue === "number" ? toPercent(uncertaintyValue) : null,
  };
}

/* ---------- Image quality (tolerant of different backend shapes) ---------- */

const QUALITY_FLAG_KEYS = [
  "passed",
  "acceptable",
  "is_acceptable",
  "ok",
  "is_ok",
  "quality_ok",
  "is_valid",
  "valid",
];

const QUALITY_TEXT_KEYS = [
  "message",
  "summary",
  "reason",
  "status",
  "quality",
  "warnings",
  "issues",
  "recommendations",
];

export function getQualityPassed(quality) {
  for (const key of QUALITY_FLAG_KEYS) {
    if (typeof quality[key] === "boolean") return quality[key];
  }

  const text = String(quality.status ?? quality.quality ?? "").toLowerCase();

  if (/fail|poor|bad|reject|invalid|unacceptable|low/.test(text)) return false;
  if (/pass|ok|good|accept|valid/.test(text)) return true;

  return null;
}

export function humanizeKey(key) {
  const text = key.replace(/_/g, " ").trim();

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatMetric(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  return String(value);
}

export function getQualityMetrics(quality) {
  const skip = new Set([
    ...QUALITY_FLAG_KEYS,
    ...QUALITY_TEXT_KEYS,
    "width",
    "height",
  ]);

  const metrics = [];

  if (typeof quality.width === "number" && typeof quality.height === "number") {
    metrics.push({
      label: "Resolution",
      value: `${quality.width} × ${quality.height} px`,
    });
  }

  Object.entries(quality).forEach(([key, value]) => {
    if (skip.has(key)) return;

    const usable =
      typeof value === "number" ||
      typeof value === "boolean" ||
      (typeof value === "string" && value.length <= 24);

    if (!usable) return;

    metrics.push({
      label: key === "score" ? "Quality score" : humanizeKey(key),
      value:
        key === "score" && typeof value === "number"
          ? value.toFixed(2)
          : formatMetric(value),
    });
  });

  return metrics.slice(0, 6);
}

export function getQualityNotes(quality) {
  const notes = [quality.warnings, quality.issues, quality.recommendations]
    .flatMap((entry) => (Array.isArray(entry) ? entry : []))
    .filter((entry) => typeof entry === "string" && entry.trim());

  return notes;
}

/* Percentage-point gap between the #1 and #2 predictions (null if unknown). */
export function getTopMargin(topPredictions) {
  if (!Array.isArray(topPredictions) || topPredictions.length < 2) return null;

  return getConfidence(topPredictions[0]) - getConfidence(topPredictions[1]);
}
