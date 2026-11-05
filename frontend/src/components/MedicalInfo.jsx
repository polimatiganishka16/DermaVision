import React from "react";
import { HeartPulse, Info, Activity, AlertCircle } from "lucide-react";

/**
 * Usage:
 *   <MedicalInfo
 *     data={result.medical_information}
 *     triage={result.triage}
 *     predictedClass={predictionLabel}
 *   />
 *
 * Renders "About this condition" from the fields of
 * models/medical_knowledge_base.json:
 *   display_name, category, description, common_features,
 *   general_care, seek_care, source, source_url
 */

const KB_KEYS = [
  "category",
  "description",
  "common_features",
  "general_care",
  "seek_care",
];

/** Accept the entry directly, or wrapped one level down. */
function resolveInfo(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  if (KB_KEYS.some((key) => key in data)) return data;

  for (const value of Object.values(data)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      KB_KEYS.some((key) => key in value)
    ) {
      return value;
    }
  }

  return null;
}

/** string | array | array-of-objects  ->  clean array of strings. */
function toList(value) {
  if (value == null) return [];

  const items = Array.isArray(value) ? value : String(value).split(/\r?\n/);

  return items
    .map((item) => {
      if (item == null) return "";
      if (typeof item === "object") {
        return String(
          item.text ?? item.title ?? item.label ?? item.description ?? ""
        );
      }
      return String(item);
    })
    .map((text) => text.replace(/^[\s•\-–*]+/, "").trim())
    .filter(Boolean);
}

function Bullets({ items, emptyText = "No information available." }) {
  if (items.length === 0) {
    return <p className="muted-text">{emptyText}</p>;
  }

  return (
    <ul className="medical-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export default function MedicalInfo({
  data,
  triage,
  predictedClass,
  showClassName = true,
}) {
  const info = resolveInfo(data);

  if (!info) {
    if (data) {
      console.warn("MEDICAL INFO: unrecognised data shape:", data);
    }
    return null;
  }

  const description = toList(info.description);
  const commonFeatures = toList(info.common_features);
  const generalCare = toList(info.general_care);
  const seekCare = toList(info.seek_care);

  const conditionName = info.display_name || predictedClass || "";

  const triageMessage =
    typeof triage === "string"
      ? triage
      : triage?.message || triage?.guidance || "";

  const source = info.source || "Reference source";
  const sourceUrl =
    typeof info.source_url === "string" && /^https?:\/\//i.test(info.source_url)
      ? info.source_url
      : "";

  return (
    <section className="card medical-card">
      <div className="section-heading">
        <div className="section-icon">
          <HeartPulse size={19} />
        </div>

        <div>
          <div className="eyebrow">EDUCATIONAL INFORMATION</div>
          <h2>About this condition</h2>
          <p>General information associated with the model's predicted class.</p>
        </div>
      </div>

      {/* BANNER: category + model class */}
      <div className="medical-banner">
        <div className="medical-banner-item">
          <span>CATEGORY</span>
          <strong>{info.category || "Not available"}</strong>
        </div>

        {showClassName && conditionName && (
          <div className="medical-banner-item">
            <span>MODEL CLASS</span>
            <strong>{conditionName}</strong>
          </div>
        )}
      </div>

      <p className="medical-scope-note">
        <Info size={14} />
        <span>
          Model classes come from broad dataset categories, so one class can
          cover several different conditions.
        </span>
      </p>

      <div className="medical-grid">
        <div className="medical-box medical-box-wide">
          <div className="medical-box-icon">
            <Info size={17} />
          </div>

          <div>
            <h3>What it is</h3>
            {description.length > 0 ? (
              description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <p>Educational information is not available.</p>
            )}
          </div>
        </div>

        <div className="medical-box">
          <div className="medical-box-icon">
            <Activity size={17} />
          </div>

          <div>
            <h3>Common features</h3>
            <Bullets
              items={commonFeatures}
              emptyText="Appearance and presentation can vary considerably between conditions."
            />
          </div>
        </div>

        <div className="medical-box">
          <div className="medical-box-icon">
            <HeartPulse size={17} />
          </div>

          <div>
            <h3>General care information</h3>
            <Bullets
              items={generalCare}
              emptyText="Consider discussing persistent or changing skin findings with a qualified healthcare professional."
            />
          </div>
        </div>

        <div className="medical-box medical-box-wide care-box">
          <div className="medical-box-icon care-icon">
            <AlertCircle size={17} />
          </div>

          <div>
            <h3>When to seek professional care</h3>
            <Bullets
              items={seekCare}
              emptyText={
                triageMessage ||
                "Consider professional evaluation for persistent, worsening, painful, rapidly changing, or otherwise concerning skin findings."
              }
            />
          </div>
        </div>
      </div>

      <div className="source-row">
        <span>Source:</span>

        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {source}
          </a>
        ) : (
          <strong>{source}</strong>
        )}
      </div>
    </section>
  );
}
