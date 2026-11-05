import React, { useId } from "react";

export default function SimpleLineChart({
  points,
  height = 160,
  yMin = 0,
  yMax = 100,
  yLabel,
  formatY = (v) => `${Math.round(v)}`,
}) {
  const gradientId = useId();

  const width = 600;
  const padding = { top: 12, right: 12, bottom: 24, left: 34 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (!points || points.length === 0) return null;

  const xAt = (index) =>
    points.length === 1
      ? padding.left + innerWidth / 2
      : padding.left + (index / (points.length - 1)) * innerWidth;

  const yAt = (value) => {
    const clamped = Math.min(yMax, Math.max(yMin, value));
    const ratio = (clamped - yMin) / (yMax - yMin || 1);
    return padding.top + innerHeight - ratio * innerHeight;
  };

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xAt(index).toFixed(1)} ${yAt(point.y).toFixed(1)}`)
    .join(" ");

  const areaPath =
    `M ${xAt(0).toFixed(1)} ${yAt(yMin).toFixed(1)} ` +
    points.map((point, index) => `L ${xAt(index).toFixed(1)} ${yAt(point.y).toFixed(1)}`).join(" ") +
    ` L ${xAt(points.length - 1).toFixed(1)} ${yAt(yMin).toFixed(1)} Z`;

  const gridLines = [yMin, (yMin + yMax) / 2, yMax];

  const maxLabels = 6;
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));

  return (
    <svg
      className="simple-line-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={yLabel ? `${yLabel} over time` : "trend chart"}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green-600)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--green-600)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((value) => (
        <g key={value}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={yAt(value)}
            y2={yAt(value)}
            className="chart-grid-line"
          />
          <text x={padding.left - 8} y={yAt(value)} className="chart-axis-label" textAnchor="end" dy="0.32em">
            {formatY(value)}
          </text>
        </g>
      ))}

      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} className="chart-line" fill="none" />

      {points.map((point, index) => (
        <circle key={index} cx={xAt(index)} cy={yAt(point.y)} r={3} className="chart-point">
          <title>{`${point.label ?? index + 1}: ${formatY(point.y)}`}</title>
        </circle>
      ))}

      {points.map((point, index) =>
        index % labelStep === 0 || index === points.length - 1 ? (
          <text
            key={`label-${index}`}
            x={xAt(index)}
            y={height - 6}
            className="chart-axis-label"
            textAnchor="middle"
          >
            {point.label}
          </text>
        ) : null
      )}
    </svg>
  );
}
