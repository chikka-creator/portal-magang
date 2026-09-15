"use client";

import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import ScoreBadge from "./ScoreBadge";
import { useBookmarks } from "@/lib/bookmark";
import { useCompare } from "@/lib/compare";

interface CompanyCardProps {
  id?: string;
  name?: string;
  city?: string;
  industry?: string | null;
  review_count?: number;
  avg_environment?: number;
  avg_mentorship?: number;
  avg_stipend?: number;
  index?: number;
  company?: any;
}

export default function CompanyCard(props: CompanyCardProps) {
  const c = props.company || props;
  const id = c.id;
  const name = c.name;
  const city = c.city;
  const industry = c.industry;
  const review_count = Number(c.review_count ?? 0);
  const avg_environment = Number(c.avg_environment ?? 0);
  const avg_mentorship = Number(c.avg_mentorship ?? 0);
  const avg_stipend = Number(c.avg_stipend ?? 0);
  const index = props.index ?? 0;

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { isInCompare, toggleCompare } = useCompare();

  const bookmarked = isBookmarked(id);
  const compared = isInCompare(id);

  const overallScore =
    review_count > 0 ? (avg_environment + avg_mentorship) / 2 : 0;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(id);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(id);
  };

  return (
    <Link
      href={`/companies/${id}`}
      className="animate-fade-in-up block h-full"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
    >
      <div className="glass-card p-5 h-full flex flex-col justify-between group relative">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate group-hover:underline underline-offset-4 decoration-[var(--text-muted)]">
                {name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {city}
                </span>
                {industry && (
                  <span className="badge-neutral text-[11px] py-0.5 px-2">
                    {industry}
                  </span>
                )}
              </div>
            </div>

            {/* Actions: Bookmark & Rating */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleBookmarkClick}
                aria-label="Bookmark"
                className={`p-1.5 rounded-lg border transition-all ${
                  bookmarked
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "border-transparent text-[var(--text-muted)] hover:text-rose-400 hover:bg-[var(--accent-tint)]"
                }`}
              >
                <svg className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {review_count > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border-hover)] bg-[var(--accent-tint)] text-xs font-semibold text-[var(--text-primary)]">
                  <span className="text-[11px] text-amber-400">★</span>
                  <span>{overallScore.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scores */}
          {review_count > 0 ? (
            <div className="grid grid-cols-2 gap-2 my-3">
              <ScoreBadge score={avg_environment} label="Lingkungan" size="sm" />
              <ScoreBadge score={avg_mentorship} label="Mentorship" size="sm" />
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic my-4">
              Belum ada ulasan
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)] text-xs">
          <button
            onClick={handleCompareClick}
            className={`text-[11px] font-medium px-2 py-0.5 rounded transition-all ${
              compared
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)]"
            }`}
          >
            {compared ? "✓ Bandingkan" : "+ Bandingkan"}
          </button>

          {review_count > 0 && (
            <span className="font-semibold text-emerald-400 font-mono">
              {formatRupiah(avg_stipend)}/bln
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
