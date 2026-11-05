import React, { useEffect, useState } from "react";
import { Clock3, Info, Trash2, ChevronDown, ImageOff } from "lucide-react";

import { clearAnalyses, deleteAnalysis, listAnalyses } from "../utils/history";

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function AssessmentTag({ kind }) {
  if (kind === "uncertain") {
    return <span className="pill pill-warn">Uncertain</span>;
  }

  if (kind === "confident") {
    return <span className="pill pill-good">Confident</span>;
  }

  return <span className="pill pill-muted">Unrated</span>;
}

function HistoryCard({ entry, expanded, onToggle, onDelete }) {
  return (
    <div className="card history-card">
      <button
        type="button"
        className="history-card-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="history-thumb">
          {entry.thumbnail ? (
            <img src={entry.thumbnail} alt="" />
          ) : (
            <ImageOff size={18} aria-hidden="true" />
          )}
        </div>

        <div className="history-card-main">
          <div className="history-card-top">
            <span className="history-timestamp">
              <Clock3 size={13} aria-hidden="true" />
              {formatTimestamp(entry.timestamp)}
            </span>
            <AssessmentTag kind={entry.assessmentKind} />
          </div>

          <h3>{entry.label}</h3>

          <div className="history-card-meta">
            <span>{entry.confidence.toFixed(1)}% confidence</span>
            {entry.category && <span>{entry.category}</span>}
          </div>
        </div>

        <ChevronDown
          size={18}
          className={expanded ? "history-chevron is-open" : "history-chevron"}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="history-card-detail">
          {entry.topPredictions.length > 0 && (
            <div className="history-top-list">
              {entry.topPredictions.map((item, index) => (
                <div className="history-top-row" key={`${item.label}-${index}`}>
                  <span>
                    {index + 1}. {item.label}
                  </span>
                  <strong>{item.confidence.toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          )}

          {typeof entry.uncertaintyPct === "number" && (
            <p className="history-detail-line">
              Uncertainty: <strong>{entry.uncertaintyPct.toFixed(1)}%</strong>
            </p>
          )}

          <button type="button" className="button danger-button" onClick={onDelete}>
            <Trash2 size={15} aria-hidden="true" />
            Delete this entry
          </button>
        </div>
      )}
    </div>
  );
}

export default function History({ onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    setEntries(listAnalyses());
  }, []);

  const handleDelete = (id) => {
    deleteAnalysis(id);
    setEntries(listAnalyses());
    if (expandedId === id) setExpandedId(null);
  };

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }

    clearAnalyses();
    setEntries([]);
    setExpandedId(null);
    setConfirmingClear(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">HISTORY</div>
          <h1>History</h1>
          <p>
            Your previous DermaVision analyses, saved on this device only. Nothing here
            is sent anywhere.
          </p>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            className={confirmingClear ? "button danger-button" : "button secondary-button"}
            onClick={handleClear}
            onBlur={() => setConfirmingClear(false)}
          >
            <Trash2 size={15} aria-hidden="true" />
            {confirmingClear ? "Click again to confirm" : "Clear all"}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="card results-empty">
          <div className="results-empty-icon">
            <Clock3 size={26} aria-hidden="true" />
          </div>

          <h3>No analyses saved yet</h3>

          <p>
            Once you run an analysis on the Analyze page, it will be saved here
            automatically.
          </p>

          <button
            type="button"
            className="button primary-button"
            onClick={() => onNavigate && onNavigate("analyze")}
          >
            Go to Analyze
          </button>
        </div>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      <div className="disclaimer-box">
        <Info size={17} aria-hidden="true" />
        <p>
          These are saved AI model predictions, not medical records. They are not a
          medical diagnosis.
        </p>
      </div>
    </div>
  );
}
