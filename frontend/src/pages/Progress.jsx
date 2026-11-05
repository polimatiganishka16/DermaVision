
import React, { useEffect, useState } from "react";
import { Activity, Info, ListChecks, TrendingUp } from "lucide-react";

import { listAnalyses } from "../utils/history";
import SimpleLineChart from "../components/SimpleLineChart";

function formatShortDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function mostFrequent(values) {
  if (values.length === 0) return null;

  const counts = new Map();

  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));

  let winner = values[0];
  let best = 0;

  counts.forEach((count, value) => {
    if (count > best) {
      best = count;
      winner = value;
    }
  });

  return { value: winner, count: best };
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Progress({ onNavigate }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(listAnalyses());
  }, []);

  if (entries.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="eyebrow">PROGRESS</div>
            <h1>Progress</h1>
            <p>A summary of your analyses in this app, built from your saved History.</p>
          </div>
        </div>

        <div className="card results-empty">
          <div className="results-empty-icon">
            <TrendingUp size={26} aria-hidden="true" />
          </div>

          <h3>Nothing to show yet</h3>

          <p>Run a few analyses and this page will summarize them for you.</p>

          <button
            type="button"
            className="button primary-button"
            onClick={() => onNavigate && onNavigate("analyze")}
          >
            Go to Analyze
          </button>
        </div>
      </div>
    );
  }

  const total = entries.length;
  const avgConfidence = entries.reduce((sum, entry) => sum + entry.confidence, 0) / total;

  const confidentCount = entries.filter((entry) => entry.assessmentKind === "confident").length;
  const uncertainCount = entries.filter((entry) => entry.assessmentKind === "uncertain").length;

  const topClass = mostFrequent(entries.map((entry) => entry.label));

  const categoryCounts = new Map();

  entries.forEach((entry) => {
    if (!entry.category) return;
    categoryCounts.set(entry.category, (categoryCounts.get(entry.category) || 0) + 1);
  });

  const categoryRows = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxCategoryCount = categoryRows.length > 0 ? categoryRows[0][1] : 1;

  const chronological = [...entries].reverse();

  const trendPoints = chronological.map((entry) => ({
    y: entry.confidence,
    label: formatShortDate(entry.timestamp),
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">PROGRESS</div>
          <h1>Progress</h1>
          <p>A summary of your analyses in this app, built from your saved History.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon={ListChecks} value={total} label="Total analyses" />
        <StatCard icon={Activity} value={`${avgConfidence.toFixed(0)}%`} label="Average confidence" />
        <StatCard
          icon={TrendingUp}
          value={topClass ? topClass.value : "—"}
          label="Most frequent prediction"
        />
        <StatCard
          icon={Info}
          value={`${confidentCount} / ${uncertainCount}`}
          label="Confident vs uncertain"
        />
      </div>

      <section className="card">
        <div className="section-heading">
          <div className="section-icon">
            <TrendingUp size={19} aria-hidden="true" />
          </div>
          <div>
            <div className="eyebrow">CONFIDENCE OVER TIME</div>
            <h2>Confidence trend</h2>
            <p>Model confidence for each saved analysis, oldest to newest.</p>
          </div>
        </div>

        <SimpleLineChart points={trendPoints} yLabel="Confidence" formatY={(v) => `${Math.round(v)}%`} />
      </section>

      {categoryRows.length > 0 && (
        <section className="card">
          <div className="section-heading">
            <div className="section-icon">
              <ListChecks size={19} aria-hidden="true" />
            </div>
            <div>
              <div className="eyebrow">BREAKDOWN</div>
              <h2>Predicted categories</h2>
              <p>How often each condition category has come up across your saved analyses.</p>
            </div>
          </div>

          <div className="top-predictions">
            {categoryRows.map(([category, count]) => (
              <div className="prediction-row-content" key={category} style={{ marginBottom: 14 }}>
                <div className="prediction-row-top">
                  <span>{category}</span>
                  <strong>{count}</strong>
                </div>
                <div className="prediction-progress">
                  <div style={{ width: `${(count / maxCategoryCount) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="disclaimer-box">
        <Info size={17} aria-hidden="true" />
        <p>
          This page tracks how you have used the app, not your skin's medical progression.
          A change in predicted category or confidence reflects the images and the model,
          not a confirmed change in any condition.
        </p>
      </div>
    </div>
  );
}
