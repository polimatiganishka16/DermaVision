import React from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";

import {
  getQualityMetrics,
  getQualityNotes,
  getQualityPassed,
} from "../utils/analysis";

export default function ImageQualityCard({ quality }) {
  if (!quality || typeof quality !== "object") return null;

  const passed = getQualityPassed(quality);
  const metrics = getQualityMetrics(quality);
  const notes = getQualityNotes(quality);

  const backendMessage =
    [quality.message, quality.summary, quality.reason].find(
      (entry) => typeof entry === "string" && entry.trim()
    ) || "";

  let title = "Image quality check completed";
  let fallbackMessage = "";

  if (passed === true) {
    title = "Image quality check passed";
    fallbackMessage = "The image met the basic quality requirements.";
  } else if (passed === false) {
    title = "Image quality may limit reliability";
    fallbackMessage =
      "A sharper, well-lit, closer photo will usually give a more reliable result.";
  }

  /* Don't repeat the title if the backend message says the same thing. */
  const candidateMessage = backendMessage || fallbackMessage;
  const shownMessage =
    candidateMessage.trim().toLowerCase().replace(/[.!\s]+$/, "") ===
    title.toLowerCase()
      ? ""
      : candidateMessage;

  return (
    <section
      className={`card quality-card ${passed === false ? "quality-card-warn" : ""}`}
    >
      <div
        className={`quality-icon ${passed === false ? "quality-icon-warn" : ""}`}
      >
        {passed === false ? <AlertCircle size={19} /> : <ShieldCheck size={19} />}
      </div>

      <div className="quality-body">
        <div className="eyebrow">IMAGE QUALITY</div>

        <h2 className="quality-title">{title}</h2>

        {shownMessage && <p className="quality-message">{shownMessage}</p>}

        {notes.length > 0 && (
          <ul className="medical-list quality-notes">
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        )}

        {metrics.length > 0 && (
          <div className="quality-metrics">
            {metrics.map((metric) => (
              <span className="quality-metric" key={metric.label}>
                {metric.label}: <strong>{metric.value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
