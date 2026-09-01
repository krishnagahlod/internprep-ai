"use client";

import React from "react";
import { RadarScores } from "./types";

interface ResumeRadarChartProps {
  scores?: RadarScores | null;
  size?: number;
}

export function ResumeRadarChart({ scores, size = 200 }: ResumeRadarChartProps) {
  if (!scores) return null;

  const metrics = [
    { label: "Quantification", value: scores.quantification || 0 },
    { label: "Action Verbs", value: scores.action_verbs || 0 },
    { label: "Structure", value: scores.structure || 0 },
    { label: "Section Balance", value: scores.section_balance || 0 },
    { label: "STAR Compliance", value: scores.star_compliance || 0 },
    { label: "Formatting", value: scores.formatting || 0 },
  ];

  const center = size / 2;
  const radius = size * 0.38;
  const angleSlice = (Math.PI * 2) / metrics.length;

  const getCoordinates = (value: number, i: number) => {
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angleSlice * i - Math.PI / 2);
    const y = center + r * Math.sin(angleSlice * i - Math.PI / 2);
    return { x, y };
  };

  const points = metrics
    .map((m, i) => {
      const { x, y } = getCoordinates(m.value, i);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-label="Resume 6-Axis Radar Chart"
      >
        {/* Concentric Polygons */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((factor, idx) => (
          <polygon
            key={idx}
            points={metrics
              .map((_, i) => {
                const { x, y } = getCoordinates(factor * 100, i);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-border/60"
            strokeWidth={1}
          />
        ))}

        {/* Axes */}
        {metrics.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-border/60"
              strokeWidth={1}
            />
          );
        })}

        {/* Filled Data Polygon */}
        <polygon
          points={points}
          fill="currentColor"
          fillOpacity={0.2}
          stroke="currentColor"
          strokeWidth={2}
          className="text-emerald-500"
        />

        {/* Vertex Points */}
        {metrics.map((m, i) => {
          const { x, y } = getCoordinates(m.value, i);
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r={3.5}
              fill="currentColor"
              className="text-emerald-500"
            />
          );
        })}
      </svg>

      {/* Axis Labels Grid */}
      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono-tech text-muted-foreground mt-3 text-center">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col">
            <span className="truncate">{m.label}</span>
            <span className="font-bold text-foreground">{m.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
