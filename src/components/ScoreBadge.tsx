"use client";

interface ScoreBadgeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export default function ScoreBadge({
  score,
  label,
  size = "md",
}: ScoreBadgeProps) {
  const sizeConfig = {
    sm: { badge: "p-2", text: "text-[10px]", score: "text-xs" },
    md: { badge: "p-2.5", text: "text-[11px]", score: "text-sm" },
    lg: { badge: "p-3.5", text: "text-xs", score: "text-lg" },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`
        ${config.badge} rounded-lg
        bg-[var(--bg-secondary)]/60
        border border-[var(--border-primary)]
        flex flex-col items-center justify-center text-center
        transition-all duration-150 shadow-2xs
      `}
    >
      <span className={`${config.score} font-semibold text-[var(--text-primary)] font-mono`}>
        {score.toFixed(1)}
      </span>
      <span className={`${config.text} text-[var(--text-muted)] font-normal mt-0.5 tracking-tight`}>
        {label}
      </span>
    </div>
  );
}
