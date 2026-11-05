import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, ChevronDown, RefreshCcw, Search } from "lucide-react";

import { API_URL } from "../config";

const CACHE_KEY = "dermavision-conditions-cache";

function normalizeEntries(raw) {
  if (!raw || typeof raw !== "object") return [];

  return Object.entries(raw)
    .map(([key, value]) => {
      if (!value || typeof value !== "object") return null;

      return {
        id: key,
        name: value.display_name || value.condition || key,
        category: value.category || "Uncategorized",
        description: value.description || "",
        commonFeatures: Array.isArray(value.common_features) ? value.common_features : [],
        generalCare: Array.isArray(value.general_care) ? value.general_care : [],
        seekCare: Array.isArray(value.seek_care) ? value.seek_care : [],
        source: value.source || "",
        sourceUrl: value.source_url || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function Learn() {
  const [status, setStatus] = useState("loading");
  const [entries, setEntries] = useState([]);
  const [fromCache, setFromCache] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const load = () => {
    setStatus("loading");

    fetch(`${API_URL}/conditions`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const normalized = normalizeEntries(data);

        setEntries(normalized);
        setFromCache(false);
        setStatus("ready");

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(normalized));
        } catch {
        }
      })
      .catch(() => {
        let cached = [];

        try {
          const raw = localStorage.getItem(CACHE_KEY);
          cached = raw ? JSON.parse(raw) : [];
        } catch {
          cached = [];
        }

        if (Array.isArray(cached) && cached.length > 0) {
          setEntries(cached);
          setFromCache(true);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      });
  };

  useEffect(load, []);

  const categories = useMemo(() => {
    const set = new Set(entries.map((entry) => entry.category));
    return ["All", ...[...set].sort()];
  }, [entries]);

  const filtered = entries.filter((entry) => {
    const matchesCategory = activeCategory === "All" || entry.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      entry.name.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">LEARN</div>
          <h1>Skin condition guide</h1>
          <p>
            Educational information about the categories this app's model was trained on,
            sourced from the app's knowledge base.
          </p>
        </div>
      </div>

      {status === "loading" && (
        <div className="card results-empty">
          <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
          <h3>Loading the condition guide…</h3>
        </div>
      )}

      {status === "error" && (
        <div className="card results-empty">
          <div className="results-empty-icon">
            <AlertCircle size={26} aria-hidden="true" />
          </div>
          <h3>Couldn't load the condition guide</h3>
          <p>
            This page reads from the backend. Make sure it's running (
            <code>uvicorn backend.api:app --reload</code>) and try again.
          </p>
          <button type="button" className="button primary-button" onClick={load}>
            <RefreshCcw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          {fromCache && (
            <div className="card quality-card quality-card-warn" style={{ marginBottom: 20 }}>
              <div className="quality-icon quality-icon-warn">
                <AlertCircle size={19} aria-hidden="true" />
              </div>
              <div className="quality-body">
                <h2 className="quality-title">Showing a saved copy</h2>
                <p className="quality-message">
                  The backend isn't reachable right now, so this is the guide from the last
                  time it loaded successfully.
                </p>
              </div>
            </div>
          )}

          <div className="card">
            <div className="search-row">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search conditions…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="chip-row" style={{ marginTop: 14 }}>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? "chip-button is-selected" : "chip-button"}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="muted-text" style={{ marginTop: 16 }}>
              No conditions match your search.
            </p>
          ) : (
            <div className="learn-list">
              {filtered.map((entry) => {
                const expanded = expandedId === entry.id;

                return (
                  <div className="card learn-card" key={entry.id}>
                    <button
                      type="button"
                      className="learn-card-header"
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      aria-expanded={expanded}
                    >
                      <div>
                        <h3>{entry.name}</h3>
                        <span className="pill pill-muted">{entry.category}</span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={expanded ? "history-chevron is-open" : "history-chevron"}
                        aria-hidden="true"
                      />
                    </button>

                    {expanded && (
                      <div className="learn-card-detail">
                        {entry.description && <p>{entry.description}</p>}

                        {entry.commonFeatures.length > 0 && (
                          <>
                            <h4>Common features</h4>
                            <ul className="medical-list">
                              {entry.commonFeatures.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </>
                        )}

                        {entry.generalCare.length > 0 && (
                          <>
                            <h4>General care</h4>
                            <ul className="medical-list">
                              {entry.generalCare.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </>
                        )}

                        {entry.seekCare.length > 0 && (
                          <>
                            <h4>When to seek professional care</h4>
                            <ul className="medical-list">
                              {entry.seekCare.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </>
                        )}

                        {entry.source && (
                          <p className="source-row">
                            <span>Source:</span>
                            {entry.sourceUrl ? (
                              <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">
                                {entry.source}
                              </a>
                            ) : (
                              <strong>{entry.source}</strong>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="disclaimer-box">
        <BookOpen size={17} aria-hidden="true" />
        <p>
          Educational information only. It is not a medical diagnosis and does not cover
          every possible presentation of a condition.
        </p>
      </div>
    </div>
  );
}
