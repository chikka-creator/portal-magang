"use client";

import React from "react";

interface RadarChartData {
  name: string;
  environment: number; // 1 to 5
  mentorship: number;  // 1 to 5
  stipendScore: number; // 1 to 5 normalized
}

interface RadarChartProps {
  companies: {
    name: string;
    environment: number;
    mentorship: number;
    stipend: number;
  }[];
}

export default function RadarChart({ companies }: RadarChartProps) {
  if (!companies || companies.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Data tidak tersedia</p>;
  }

  // Find max stipend to normalize to 1..5
  const maxStipend = Math.max(...companies.map((c) => c.stipend), 1000000);

  const normalized = companies.slice(0, 3).map((c) => ({
    name: c.name,
    environment: c.environment,
    mentorship: c.mentorship,
    stipendScore: Math.min(5, Math.max(1, (c.stipend / maxStipend) * 5)),
  }));

  // Polygon calculations (center 150, 150, radius 100)
  const center = 150;
  const radius = 100;
  const angles = [
    -Math.PI / 2, // Top (Lingkungan)
    -Math.PI / 2 + (2 * Math.PI) / 3, // Bottom Right (Mentorship)
    -Math.PI / 2 + (4 * Math.PI) / 3, // Bottom Left (Uang Saku)
  ];

  const labels = ["Lingkungan Kerja", "Bimbingan Mentor", "Taraf Uang Saku"];

  const colors = [
    { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.25)" },
    { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.25)" },
    { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.25)" },
  ];

  const getCoordinates = (value: number, angleIndex: number) => {
    const r = (value / 5) * radius;
    const angle = angles[angleIndex];
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-[300px] h-[300px]">
        <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
          {/* Concentric grid webs (1 to 5) */}
          {[1, 2, 3, 4, 5].map((level) => {
            const points = angles
              .map((_, i) => getCoordinates(level, i))
              .join(" ");
            return (
              <polygon
                key={level}
                points={points}
                fill="none"
                stroke="currentColor"
                className="text-border"
                strokeWidth="1"
                strokeDasharray={level < 5 ? "3,3" : "none"}
              />
            );
          })}

          {/* Axes from center */}
          {angles.map((angle, i) => {
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeWidth="1"
              />
            );
          })}

          {/* Data Polygons */}
          {normalized.map((item, idx) => {
            const points = [
              getCoordinates(item.environment, 0),
              getCoordinates(item.mentorship, 1),
              getCoordinates(item.stipendScore, 2),
            ].join(" ");

            const c = colors[idx % colors.length];

            return (
              <polygon
                key={idx}
                points={points}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth="2"
                className="transition-all duration-500"
              />
            );
          })}

          {/* Axis Labels */}
          <text
            x={center}
            y={center - radius - 14}
            textAnchor="middle"
            className="text-[10px] font-medium fill-current text-foreground"
          >
            {labels[0]}
          </text>
          <text
            x={center + radius + 15}
            y={center + radius / 2 + 15}
            textAnchor="start"
            className="text-[10px] font-medium fill-current text-foreground"
          >
            {labels[1]}
          </text>
          <text
            x={center - radius - 15}
            y={center + radius / 2 + 15}
            textAnchor="end"
            className="text-[10px] font-medium fill-current text-foreground"
          >
            {labels[2]}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
        {normalized.map((item, idx) => {
          const c = colors[idx % colors.length];
          return (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: c.stroke }}
              />
              <span className="font-medium text-foreground">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
