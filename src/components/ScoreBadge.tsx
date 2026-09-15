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
    sm: { badge: "p-2", text: "text-[10px]", score: "text-sm" },
    md: { badge: "p-3", text: "text-xs", score: "text-base" },
    lg: { badge: "p-4", text: "text-xs", score: "text-xl" },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`
        ${config.badge} rounded-lg
        bg-[var(--accent-tint)]
        border border-[var(--border-primary)]
        flex flex-col items-center justify-center text-center
        transition-all duration-150
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
