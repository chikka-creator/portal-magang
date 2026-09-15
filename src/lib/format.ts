/**
 * Formatting utilities for the Portal Magang frontend.
 */

/**
 * Format a number as Indonesian Rupiah currency.
 * @example formatRupiah(500000) → "Rp 500.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string to Indonesian locale.
 * @example formatDate("2026-09-14T08:00:00Z") → "14 September 2026"
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

/**
 * Format a relative time string (e.g., "2 hari yang lalu").
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay < 30) return `${diffDay} hari yang lalu`;
  if (diffMonth < 12) return `${diffMonth} bulan yang lalu`;
  return formatDate(dateString);
}

/**
 * Calculate the average of two scores and return a descriptive label.
 */
export function getOverallScoreLabel(avg: number): string {
  if (avg >= 4.5) return "Sangat Baik";
  if (avg >= 3.5) return "Baik";
  if (avg >= 2.5) return "Cukup";
  if (avg >= 1.5) return "Kurang";
  return "Sangat Kurang";
}

/**
 * Get a color class based on score value (for Tailwind).
 */
export function getScoreColor(score: number): string {
  if (score >= 4.0) return "text-zinc-100";
  if (score >= 3.0) return "text-zinc-300";
  return "text-zinc-400";
}

/**
 * Get a subtle background class based on score value.
 */
export function getScoreGradient(score: number): string {
  if (score >= 4.0) return "from-zinc-800/70 to-zinc-900/50";
  if (score >= 3.0) return "from-zinc-800/50 to-zinc-900/30";
  return "from-zinc-900/60 to-zinc-950/40";
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}
