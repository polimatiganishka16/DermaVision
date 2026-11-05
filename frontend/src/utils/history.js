
/*
  Saved-analysis history, kept entirely in the browser (localStorage).
  Nothing here is sent to any server.

  Each entry is deliberately lightweight: a small thumbnail plus the
  headline numbers, not the full API response. The Grad-CAM images alone
  can be several hundred KB of base64 per analysis, and localStorage is
  usually capped around 5-10 MB, so storing full results would fill that
  up after a handful of analyses. History and Progress only ever need the
  summary numbers, not a full replay of the visual explanation.
*/

import {
  findClassName,
  getAssessmentInfo,
  getConfidence,
  getMedical,
  getTopPrediction,
  getTopPredictions,
} from "./analysis";

const STORAGE_KEY = "dermavision-history";
const MAX_ENTRIES = 60;
const THUMB_SIZE = 96;

/* ---------- reading and writing ---------- */

export function listAnalyses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    try {
      const lean = entries.map((entry) => ({ ...entry, thumbnail: null }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lean));
      return true;
    } catch {
      return false;
    }
  }
}

export function deleteAnalysis(id) {
  const entries = listAnalyses().filter((entry) => entry.id !== id);
  return persist(entries);
}

export function clearAnalyses() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/* ---------- building a new entry ---------- */

export function makeThumbnail(file) {
  return new Promise((resolve) => {
    if (!file || typeof file.type !== "string" || !file.type.startsWith("image/")) {
      resolve(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    image.onload = () => {
      try {
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const sx = (image.naturalWidth - side) / 2;
        const sy = (image.naturalHeight - side) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = THUMB_SIZE;
        canvas.height = THUMB_SIZE;

        const context = canvas.getContext("2d");

        if (!context) {
          cleanup();
          resolve(null);
          return;
        }

        context.drawImage(image, sx, sy, side, side, 0, 0, THUMB_SIZE, THUMB_SIZE);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        resolve(null);
      }
    };

    image.onerror = () => {
      cleanup();
      resolve(null);
    };

    image.src = objectUrl;
  });
}

function summarize(result) {
  const prediction = getTopPrediction(result);
  const topPredictions = getTopPredictions(result);
  const medical = getMedical(result);
  const assessment = getAssessmentInfo(result?.assessment);

  const label =
    findClassName(prediction) ||
    result?.explainability?.target_class ||
    medical?.display_name ||
    medical?.condition ||
    "Unknown";

  return {
    label,
    confidence: getConfidence(prediction),
    assessmentKind: assessment?.kind || "unknown",
    uncertaintyPct:
      typeof assessment?.uncertaintyPct === "number" ? assessment.uncertaintyPct : null,
    category: medical?.category || null,
    topPredictions: topPredictions.slice(0, 3).map((item, index) => ({
      label: findClassName(item) || (index === 0 ? label : `Class ${index + 1}`),
      confidence: getConfidence(item),
    })),
  };
}

export async function saveAnalysis(result, file) {
  let thumbnail = null;

  try {
    thumbnail = await makeThumbnail(file);
  } catch {
    thumbnail = null;
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    thumbnail,
    ...summarize(result),
  };

  const entries = [entry, ...listAnalyses()].slice(0, MAX_ENTRIES);

  return persist(entries) ? entry : null;
}
