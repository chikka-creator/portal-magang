"use client";

import React from "react";

interface LineChartProps {
  data: {
    month: string;
    reviewCount: number;
    avgStipend: number;
  }[];
}

export default function LineChart({ data }: LineChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Data trend tidak tersedia</p>;
  }

  const width = 450;
  const height = 180;
  const padding = 30;

  const maxReviews = Math.max(...data.map((d) => d.reviewCount), 5);

  const points = data.map((d, idx) => {
    const x = padding + (idx / Math.max(data.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - (d.reviewCount / maxReviews) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  // Area under line
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[220px] overflow-visible"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = height - padding - ratio * (height - 2 * padding);
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#lineGrad)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots & Labels */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              className="fill-background stroke-primary"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              className="text-[10px] font-mono font-semibold fill-current text-foreground"
            >
              {p.reviewCount} ulasan
            </text>
            <text
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              className="text-[10px] font-medium fill-current text-muted-foreground"
            >
              {p.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
