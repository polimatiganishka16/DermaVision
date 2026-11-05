import React, { useEffect, useState } from "react";
import { Sparkles, Info, AlertCircle } from "lucide-react";

import { analyzeHeatmap } from "../utils/heatmapAnalysis";

/*
  Usage: <GradCAM data={result.explainability} />

  explainability: {
    gradcam_available: true,
    target_class: "...",
    heatmap_base64: "...",
    overlay_base64: "...",
    gradcam_message: "...",
    layers: [...]            (optional)
  }
*/

function toImageSrc(value) {
  if (typeof value !== "string" || value.trim() === "") return null;

  const trimmed = value.trim();

  return trimmed.startsWith("data:image")
    ? trimmed
    : `data:image/png;base64,${trimmed}`;
}

/* `layers` can be strings or objects; only ever render readable text. */
function getLayerNames(layers) {
  const list = Array.isArray(layers) ? layers : layers ? [layers] : [];

  return list
    .map((layer) => {
      if (typeof layer === "string") return layer;

      if (layer && typeof layer === "object") {
        const name =
          layer.name ?? layer.layer ?? layer.layer_name ?? layer.module ?? layer.id;

        return typeof name === "string" ? name : null;
      }

      return null;
    })
    .filter(Boolean);
}

function SectionHeading() {
  return (
    <div className="section-heading">
      <div className="section-icon">
        <Sparkles size={18} />
      </div>

      <div>
        <div className="eyebrow">EXPLAINABLE AI</div>
        <h2>Visual explanation</h2>
        <p>Areas that contributed to the model's prediction.</p>
      </div>
    </div>
  );
}

function Unavailable({ message }) {
  return (
    <section className="card explainability-card">
      <SectionHeading />

      <div className="info-box">
        <Info size={18} />

        <div>
          <strong>Visual explanation unavailable</strong>
          <p>{message}</p>
        </div>
      </div>
    </section>
  );
}

export default function GradCAM({ data }) {
  const [focus, setFocus] = useState(null);
  const [view, setView] = useState("overlay");

  const heatmapSrc = toImageSrc(data?.heatmap_base64);
  const overlaySrc = toImageSrc(data?.overlay_base64);

  useEffect(() => {
    console.log("GRADCAM COMPONENT DATA:", data);
  }, [data]);

  /* Work out where the strongest highlight sits (browser-side only). */
  useEffect(() => {
    let cancelled = false;

    setFocus(null);

    if (!heatmapSrc) return undefined;

    analyzeHeatmap(heatmapSrc)
      .then((analysis) => {
        if (!cancelled) setFocus(analysis);
      })
      .catch(() => {
        /* The extra hints are optional. Ignore failures. */
      });

    return () => {
      cancelled = true;
    };
  }, [heatmapSrc]);

  if (!data) {
    return <Unavailable message="No Grad-CAM data was returned for this analysis." />;
  }

  const isAvailable = data.gradcam_available === true || data.available === true;

  if (!isAvailable || (!heatmapSrc && !overlaySrc)) {
    return (
      <Unavailable
        message={
          data.gradcam_message ||
          data.message ||
          "A Grad-CAM visualization could not be generated for this analysis."
        }
      />
    );
  }

  const hasBoth = Boolean(overlaySrc && heatmapSrc);

  const activeView =
    view === "heatmap" && heatmapSrc ? "heatmap" : overlaySrc ? "overlay" : "heatmap";

  const layerNames = getLayerNames(data.layers);

  return (
    <section className="card explainability-card">
      <SectionHeading />

      <div className="gradcam-note">
        <Info size={16} />

        <span>
          Grad-CAM highlights image regions that influenced the model's
          prediction. It is an AI attribution visualization, not a lesion
          segmentation or clinical diagnosis.
        </span>
      </div>

      {hasBoth && (
        <div className="segmented" role="group" aria-label="Visualization type">
          <button
            type="button"
            className={`segmented-button ${activeView === "overlay" ? "is-active" : ""}`}
            aria-pressed={activeView === "overlay"}
            onClick={() => setView("overlay")}
          >
            Overlay
          </button>

          <button
            type="button"
            className={`segmented-button ${activeView === "heatmap" ? "is-active" : ""}`}
            aria-pressed={activeView === "heatmap"}
            onClick={() => setView("heatmap")}
          >
            Heatmap
          </button>
        </div>
      )}

      <div className="gradcam-single">
        <div className="gradcam-image-wrapper">
          <img
            src={activeView === "overlay" ? overlaySrc : heatmapSrc}
            alt={
              activeView === "overlay"
                ? "Grad-CAM prediction overlay"
                : "Grad-CAM activation heatmap"
            }
            className="gradcam-image"
          />
        </div>

        <p className="gradcam-caption">
          {activeView === "overlay"
            ? "Original image with the attribution overlay."
            : "Model activation heatmap on its own."}
        </p>
      </div>

      {/* LEGEND + HOW TO READ */}
      <div className="gradcam-legend">
        <div className="gradcam-legend-scale" aria-hidden="true">
          <span>Lower influence</span>
          <div className="gradcam-legend-bar"></div>
          <span>Higher influence</span>
        </div>

        <p className="gradcam-legend-text">
          Warmer colours (yellow, red) mark regions with more influence on this
          prediction; cooler colours (blue) mark less. Highlights can also fall
          on borders, lighting, background or watermarks, so they do not show
          where a condition is.
        </p>
      </div>

      {/* FOCUS HINTS (computed in the browser from the heatmap) */}
      {focus && (focus.region || focus.hotAreaPct > 0) && (
        <div className="gradcam-focus">
          {focus.region && (
            <span className="gradcam-chip">
              Strongest area: <strong>{focus.region}</strong>
            </span>
          )}

          <span className="gradcam-chip">
            Strongly highlighted:{" "}
            <strong>
              {focus.hotAreaPct < 1 ? "<1" : Math.round(focus.hotAreaPct)}% of image
            </strong>
          </span>
        </div>
      )}

      {focus?.nearEdge && (
        <div className="gradcam-caution" role="note">
          <AlertCircle size={17} />

          <span>
            Part of the strongest highlighting sits near the image border. Grad-CAM
            can respond to borders, lighting, background or watermarks rather than
            the skin itself, so read this visualization with extra caution.
          </span>
        </div>
      )}

      {data.target_class && (
        <div className="gradcam-target">
          <div>
            <span>Target class</span>
            <strong>{data.target_class}</strong>
          </div>
        </div>
      )}

      {layerNames.length > 0 && (
        <details className="gradcam-tech">
          <summary>Technical details</summary>

          <p>
            Model layers used to build the visualization:{" "}
            <strong>{layerNames.join(", ")}</strong>
          </p>
        </details>
      )}
    </section>
  );
}
