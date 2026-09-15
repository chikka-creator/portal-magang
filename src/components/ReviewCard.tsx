"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatRupiah, formatRelativeTime } from "@/lib/format";
import StarRating from "./StarRating";
import CompanyReplyCard from "./CompanyReplyCard";
import type { ReviewPublic } from "@/lib/types";

interface ReviewCardProps {
  review: ReviewPublic;
  index?: number;
  showCompanyName?: boolean;
}

export default function ReviewCard({
  review,
  index = 0,
  showCompanyName = false,
}: ReviewCardProps) {
  const [mounted, setMounted] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("spam");
  const [flagDesc, setFlagDesc] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);
  const [flagStatus, setFlagStatus] = useState<string | null>(null);
  const [isFlagSubmitting, setIsFlagSubmitting] = useState(false);
  const [flagError, setFlagError] = useState("");

  const FLAG_REASONS = [
    {
      id: "spam",
      title: "Spam atau Iklan Promosi",
      description: "Promosi komersial, tautan mencurigakan, atau teks berulang tanpa ulasan relevan.",
      icon: "🚫",
    },
    {
      id: "inappropriate",
      title: "Kata Kasar / SARA / Pelecehan",
      description: "Mengandung ujaran kebencian, pencemaran nama baik, atau kata vulgar tidak pantas.",
      icon: "⚠️",
    },
    {
      id: "fake",
      title: "Informasi Palsu / Manipulasi",
      description: "Ulasan fiktif, bukan siswa magang sebenarnya, atau memanipulasi nominal uang saku.",
      icon: "❌",
    },
    {
      id: "other",
      title: "Pelanggaran Etika Lainnya",
      description: "Pelanggaran ketentuan dan etika komunitas portal magang lainnya.",
      icon: "💬",
    },
  ];

  // Close modal on Escape key
  useEffect(() => {
    if (!showFlagModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isFlagSubmitting) {
        setShowFlagModal(false);
        setFlagError("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFlagModal, isFlagSubmitting]);

  const handleVote = async () => {
    if (hasVoted || isVoting) return;

    setIsVoting(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/vote`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setHelpfulCount(data.helpful_count);
        setHasVoted(true);
      } else if (res.status === 409) {
        setHasVoted(true);
      }
    } catch {
      console.error("Vote failed");
    } finally {
      setIsVoting(false);
    }
  };

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFlagSubmitting(true);
    setFlagError("");
    try {
      const res = await fetch("/api/admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: review.id,
          reason: flagReason,
          description: flagDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan laporan. Silakan coba lagi.");
      }
      setFlagStatus("Laporan Anda berhasil dikirim ke moderator.");
      setTimeout(() => {
        setShowFlagModal(false);
        setFlagStatus(null);
        setFlagDesc("");
        setFlagReason("spam");
      }, 2000);
    } catch (err: any) {
      setFlagError(err.message || "Terjadi kesalahan saat mengirim laporan.");
    } finally {
      setIsFlagSubmitting(false);
    }
  };

  const overallScore =
    (review.environment_score + review.mentorship_score) / 2;

  return (
    <div
      className="glass-card p-5 animate-fade-in-up flex flex-col justify-between relative group"
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
    >
      <div>
        {/* Most Helpful Badge */}
        {review.is_most_helpful && (
          <div className="mb-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span>✨</span> Paling Membantu
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {showCompanyName && review.company_name && (
              <p className="text-xs font-semibold text-[var(--text-primary)] tracking-tight mb-1">
                {review.company_name}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {review.position}
              </span>
              <span className="badge-neutral font-mono text-[11px] py-0.5 px-2">
                {formatRupiah(review.stipend_amount)}/bln
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              {formatRelativeTime(review.created_at)}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--accent-tint)] border border-[var(--border-primary)] text-xs font-semibold text-[var(--text-primary)] font-mono flex-shrink-0">
            <span className="opacity-70 text-[11px]">★</span>
            <span>{overallScore.toFixed(1)}</span>
          </div>
        </div>

        {/* Breakdown Ratings */}
        <div className="grid grid-cols-2 gap-3 py-2.5 my-2 border-y border-[var(--border-primary)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">Lingkungan</span>
            <StarRating value={review.environment_score} readonly size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">Mentorship</span>
            <StarRating value={review.mentorship_score} readonly size="sm" />
          </div>
        </div>

        {/* Review text */}
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed my-3">
          {review.review_text}
        </p>

        {/* Company Official Reply if exists */}
        {review.reply && (
          <CompanyReplyCard reply={review.reply} />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)] text-xs mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleVote}
            disabled={hasVoted || isVoting}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
              transition-all duration-150
              ${
                hasVoted
                  ? "bg-[var(--accent-tint)] text-[var(--text-primary)] border border-[var(--border-hover)] cursor-default scale-98"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] border border-[var(--border-primary)] active:scale-95"
              }
            `}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${hasVoted ? "fill-current scale-110" : ""}`}
              fill={hasVoted ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span>{hasVoted ? "Terima kasih" : "Bermanfaat"}</span>
            <span className="font-mono text-[var(--text-muted)]">({helpfulCount})</span>
          </button>

          <button
            onClick={() => {
              setShowFlagModal(true);
              setFlagError("");
            }}
            className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 px-2 py-1 rounded-md transition-all text-xs cursor-pointer group/flag"
            title="Laporkan ulasan yang bermasalah"
          >
            <svg
              className="w-3.5 h-3.5 transition-transform group-hover/flag:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
            <span className="text-[11px] font-medium hidden sm:inline">Laporkan</span>
          </button>
        </div>

        <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
          <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Anonim
        </span>
      </div>

      {/* Flag Modal */}
      {showFlagModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isFlagSubmitting) {
              setShowFlagModal(false);
              setFlagError("");
            }
          }}
        >
          <div
            className="relative w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-hover)] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-left overflow-hidden max-h-[90vh] flex flex-col transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Top Accent Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center text-lg shrink-0 shadow-sm">
                  🚩
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                    Laporkan Ulasan Ini
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Bantu kami menjaga ulasan tetap akurat, etis, dan aman bagi siswa SMK
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isFlagSubmitting) {
                    setShowFlagModal(false);
                    setFlagError("");
                  }
                }}
                className="w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] flex items-center justify-center transition-colors cursor-pointer text-sm"
                title="Tutup (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto space-y-4 pr-1 py-1">
              {flagStatus ? (
                /* Success State Screen */
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-3xl mx-auto animate-bounce">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-base font-bold text-[var(--text-primary)]">
                      Laporan Berhasil Terkirim!
                    </h5>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                      Terima kasih atas kontribusi Anda. Tim moderator kami akan segera meninjau ulasan ini demi kenyamanan seluruh siswa.
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFlagModal(false);
                        setFlagStatus(null);
                      }}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-tint)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFlagSubmit} className="space-y-4">
                  {/* Context Quote Preview */}
                  <div className="p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--border-primary)] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                      <span className="font-bold uppercase tracking-wider text-rose-400/90 flex items-center gap-1">
                        <span>🔍</span> Ulasan Terkait
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        ★ {overallScore.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] italic line-clamp-2 leading-relaxed">
                      "{review.review_text}"
                    </p>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 pt-0.5">
                      <span>📌 {review.position}</span>
                      {review.company_name && <span>• {review.company_name}</span>}
                    </div>
                  </div>

                  {flagError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{flagError}</span>
                    </div>
                  )}

                  {/* Reason Selection Radio Cards */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      Pilih Alasan Pelanggaran *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {FLAG_REASONS.map((opt) => {
                        const isSelected = flagReason === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setFlagReason(opt.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? "bg-rose-500/10 border-rose-500/50 shadow-sm"
                                : "bg-[var(--accent-tint)]/40 border-[var(--border-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--accent-tint)]"
                            }`}
                          >
                            <span className="text-lg shrink-0 mt-0.5">{opt.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-semibold ${
                                    isSelected ? "text-rose-400" : "text-[var(--text-primary)]"
                                  }`}
                                >
                                  {opt.title}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected
                                      ? "border-rose-500 bg-rose-500"
                                      : "border-[var(--border-hover)] bg-transparent"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  )}
                                </div>
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                                {opt.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Details Textarea with Character Count */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[var(--text-primary)]">
                        Keterangan Tambahan{" "}
                        <span className="text-[10px] font-normal text-[var(--text-muted)]">
                          (Opsional)
                        </span>
                      </label>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {flagDesc.length} / 300
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={flagDesc}
                      onChange={(e) => setFlagDesc(e.target.value)}
                      placeholder="Jelaskan secara singkat bagian mana yang melanggar ketentuan..."
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 transition-all resize-none"
                    />
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-primary)]">
                    <button
                      type="button"
                      disabled={isFlagSubmitting}
                      onClick={() => {
                        setShowFlagModal(false);
                        setFlagError("");
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] border border-[var(--border-primary)] transition-all cursor-pointer disabled:opacity-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isFlagSubmitting}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-600/20 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isFlagSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mengirim Laporan...</span>
                        </>
                      ) : (
                        <>
                          <span>🚩</span>
                          <span>Kirim Laporan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
