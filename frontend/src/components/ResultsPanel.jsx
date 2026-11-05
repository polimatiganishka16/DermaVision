import React from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  HeartPulse,
  Info,
  RotateCcw,
} from "lucide-react";

import ImageQualityCard from "./ImageQualityCard";
import MedicalInfo from "./MedicalInfo";

import {
  findClassName,
  formatConfidence,
  getAssessmentInfo,
  getConfidence,
  getMedical,
  getTopMargin,
  getTopPrediction,
  getTopPredictions,
  getTriage,
} from "../utils/analysis";

/*
  Usage: <ResultsPanel result={result} onReset={handleReset} />

  Everything except the Grad-CAM card (which lives under the image, in the
  left column). It only reads the `result` object, so it can be reused for
  any saved analysis that has the same shape.
*/

/* Near-tie threshold: below this many percentage points between #1 and #2,
   say so explicitly. */
const NEAR_TIE_POINTS = 5;

export default function ResultsPanel({ result, onReset }) {
  const prediction = getTopPrediction(result);
  const topPredictions = getTopPredictions(result);
  const medical = getMedical(result);
  const triage = getTriage(result);
  const assessment = getAssessmentInfo(result?.assessment);

  /* Fall back to the Grad-CAM target class or the knowledge-base name, which
     both describe the same predicted class. */
  const predictionLabel =
    findClassName(prediction) ||
    result?.explainability?.target_class ||
    medical?.display_name ||
    "Unknown";

  const confidence = getConfidence(prediction);
  const margin = getTopMargin(topPredictions);

  const kind = assessment?.kind || "unknown";
  const uncertain = kind === "uncertain";
  const confident = kind === "confident";

  return (
    <div className="results-container">
      {/* HEADER */}
      <div className="rp-header">
        <h2>Results</h2>

        {onReset && (
          <button
            type="button"
            className="button secondary-button"
            onClick={onReset}
          >
            <RotateCcw size={16} />
            New analysis
          </button>
        )}
      </div>

      {/* MAIN PREDICTION */}
      <section className="card rp-main">
        <div className="eyebrow">
          {uncertain ? "TOP-RANKED CLASS" : "MODEL PREDICTION"}
        </div>

        <h2 className="rp-class">{predictionLabel}</h2>

        <div className="rp-pills">
          {assessment && (
            <span
              className={`pill ${
                uncertain ? "pill-warn" : confident ? "pill-good" : "pill-muted"
              }`}
            >
              {uncertain ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              {uncertain && "Uncertain prediction"}
              {confident && "Confident prediction"}
              {kind === "unknown" && (assessment.raw || "Model assessment")}
            </span>
          )}

          <span className="pill pill-info">
            <BarChart3 size={14} />
            {formatConfidence(confidence)} confidence
          </span>

          {assessment?.uncertaintyPct !== null &&
            assessment?.uncertaintyPct !== undefined && (
              <span className="pill pill-muted">
                Uncertainty {formatConfidence(assessment.uncertaintyPct)}
              </span>
            )}
        </div>

        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
          ></div>
        </div>

        {uncertain && (
          <div className="rp-alert" role="note">
            <AlertCircle size={17} />

            <div>
              <strong>No confident match.</strong> The model is not confident
              in this result. Treat it as low-reliability educational
              information and consider the other classes below. It is not a
              diagnosis.
              {margin !== null && margin < NEAR_TIE_POINTS && (
                <>
                  {" "}
                  Only <strong>{margin.toFixed(1)} percentage points</strong>{" "}
                  separate the top two classes.
                </>
              )}
            </div>
          </div>
        )}

        {confident && (
          <p className="assessment-note">
            The model is relatively confident in this result. It is still an
            AI prediction, not a diagnosis.
          </p>
        )}
      </section>

      {/* IMAGE QUALITY */}
      <ImageQualityCard quality={result?.image_quality} />

      {/* TOP PREDICTIONS */}
      {topPredictions.length > 0 && (
        <section className="card">
          <div className="section-heading">
            <div className="section-icon">
              <Activity size={18} />
            </div>

            <div>
              <div className="eyebrow">MODEL OUTPUT</div>
              <h2>Top predictions</h2>
              <p>Other classes considered by the model.</p>
            </div>
          </div>

          <div className="top-predictions">
            {topPredictions.slice(0, 3).map((item, index) => {
              const label =
                findClassName(item) ||
                (index === 0 ? predictionLabel : "") ||
                `Class ${index + 1}`;

              const value = getConfidence(item);

              return (
                <div className="top-prediction-row" key={`${label}-${index}`}>
                  <div className="prediction-rank">{index + 1}</div>

                  <div className="prediction-row-content">
                    <div className="prediction-row-top">
                      <span>{label}</span>
                      <strong>{formatConfidence(value)}</strong>
                    </div>

                    <div className="prediction-progress">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, value))}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CONDITION INFORMATION */}
      {medical && (
        <MedicalInfo
          data={medical}
          triage={triage}
          showClassName={false}
        />
      )}

      {/* CARE GUIDANCE */}
      {triage && (
        <section className="triage-card">
          <div className="triage-icon">
            <HeartPulse size={21} />
          </div>

          <div>
            <div className="eyebrow">CARE GUIDANCE</div>

            <h2>
              {triage.title || triage.heading || "When to seek professional care"}
            </h2>

            <p>
              {triage.message ||
                triage.description ||
                triage.reason ||
                "Consider discussing concerning or changing skin findings with a qualified healthcare professional."}
            </p>
          </div>
        </section>
      )}

      {/* DISCLAIMER */}
      <div className="disclaimer-box">
        <Info size={17} />

        <p>
          {result?.disclaimer ||
            "This is an AI-generated prediction, not a medical diagnosis. DermaVision is intended for educational and decision-support purposes only."}
        </p>
      </div>
    </div>
  );
}
