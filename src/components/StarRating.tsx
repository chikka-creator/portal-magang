"use client";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  label?: string;
}

export default function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  label,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-6 h-6",
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-xs text-[var(--text-muted)] mr-1">
          {label}
        </span>
      )}
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`
              ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}
              transition-transform duration-150 focus:outline-none
            `}
            aria-label={`${star} bintang`}
          >
            <svg
              className={`${sizeClasses[size]} transition-colors duration-150`}
              viewBox="0 0 24 24"
              fill={star <= value ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={star <= value ? 0 : 1.25}
            >
              <path
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                className={
                  star <= value
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] opacity-30"
                }
              />
            </svg>
          </button>
        ))}
      </div>
      <span className="text-xs font-mono font-medium text-[var(--text-secondary)] ml-1">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
