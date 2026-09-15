"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ScoreBadge from "@/components/ScoreBadge";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import PhotoGrid from "@/components/PhotoGrid";
import ClaimModal from "@/components/ClaimModal";
import CompanyQNA from "@/components/CompanyQNA";
import CompareDrawer from "@/components/CompareDrawer";
import { formatRupiah } from "@/lib/format";
import type { CompanyDetail, ReviewPublic } from "@/lib/types";

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reviews" | "qna">("reviews");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [compRes, revRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/reviews?company_id=${companyId}`),
      ]);

      const [compJson, revJson] = await Promise.all([
        compRes.json(),
        revRes.json(),
      ]);

      if (compJson.success) setCompany(compJson.data);
      if (revJson.success) setReviews(revJson.data);
    } catch (err) {
      console.error("Failed to load company details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const overallScore =
    company && company.review_count > 0
      ? (company.avg_environment + company.avg_mentorship) / 2
      : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* 1. Static Sidebar */}
      <Sidebar />

      {/* 2. Independently Scrollable Main Area */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 pb-24">
          {/* Back Navigation & Report Button */}
          <div className="pt-12 lg:pt-0 flex items-center justify-between gap-4">
            <Link
              href="/companies"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar Perusahaan
            </Link>

            {company && (
              <Link
                href={`/companies/${companyId}/report`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:bg-[var(--accent-tint)] text-xs font-semibold text-[var(--text-primary)] transition-all shadow-xs"
              >
                <span>🖨️ Cetak Laporan BK (PDF)</span>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-44 rounded-xl skeleton" />
              <div className="h-64 rounded-xl skeleton" />
            </div>
          ) : !company ? (
            <div className="p-10 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
              <p className="text-sm text-red-400 font-medium">Perusahaan tidak ditemukan.</p>
            </div>
          ) : (
            <>
              {/* Minimalist Company Header Card */}
              <div className="glass-card p-5 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge-neutral text-[11px]">
                        {company.industry || "Industri Umum"}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {company.city}
                      </span>
                      {company.is_claimed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                          Terverifikasi
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowClaimModal(true)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-dashed border-[var(--border-primary)] hover:border-[var(--border-hover)] transition-colors"
                        >
                          Klaim Profil
                        </button>
                      )}
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      {company.name}
                    </h1>

                    <p className="text-xs text-[var(--text-muted)]">
                      Total ulasan: <strong className="text-[var(--text-primary)] font-mono">{company.review_count}</strong> siswa SMK
                    </p>
                  </div>

                  {/* Rating & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--border-primary)]">
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Skor Reputasi</p>
                        <p className="text-xl sm:text-2xl font-bold font-mono text-[var(--text-primary)]">
                          ★ {overallScore.toFixed(1)} <span className="text-xs text-[var(--text-muted)] font-normal">/ 5.0</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="btn-primary text-xs py-2 px-3.5"
                    >
                      + Tulis Ulasan
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-5 border-t border-[var(--border-primary)]">
                  <ScoreBadge score={company.avg_environment} label="Lingkungan Kerja" size="md" />
                  <ScoreBadge score={company.avg_mentorship} label="Bimbingan Mentor" size="md" />

                  <div className="p-3 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-primary)] flex flex-col items-center justify-center text-center">
                    <span className="text-sm sm:text-base font-semibold text-[var(--text-primary)] font-mono">
                      {formatRupiah(company.avg_stipend)}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Rata-rata Uang Saku
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-primary)] flex flex-col items-center justify-center text-center">
                    <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] font-mono">
                      {formatRupiah(company.min_stipend)} - {formatRupiah(company.max_stipend)}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Rentang Kompensasi
                    </span>
                  </div>
                </div>
              </div>

              {/* SPEC REQUIREMENT: Photo Grid */}
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-5 sm:p-6">
                <PhotoGrid companyName={company.name} />
              </div>

              {/* Tabs Switcher: Reviews vs Q&A */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border-primary)] pb-2">
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "reviews"
                        ? "bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)]"
                    }`}
                  >
                    💬 Ulasan Siswa ({reviews.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("qna")}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "qna"
                        ? "bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)]"
                    }`}
                  >
                    ❓ Tanya Jawab (Q&A)
                  </button>
                </div>

                {/* Tab 1: Reviews Feed */}
                {activeTab === "reviews" && (
                  <div className="space-y-3.5">
                    {reviews.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                        <p className="text-xs text-[var(--text-muted)]">Belum ada review untuk perusahaan ini.</p>
                        <button
                          onClick={() => setShowReviewModal(true)}
                          className="mt-3 btn-primary text-xs py-1.5 px-3"
                        >
                          Beri ulasan pertama
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviews.map((rev, idx) => (
                          <ReviewCard
                            key={rev.id}
                            review={rev}
                            index={idx}
                            showCompanyName={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Q&A Forum */}
                {activeTab === "qna" && (
                  <CompanyQNA companyId={companyId} />
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Compare Drawer */}
      <CompareDrawer />

      {/* Review Modal */}
      {showReviewModal && company && (
        <div
          className="modal-overlay"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="modal-content w-full max-w-lg mx-4 p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)] mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                  Ulas {company.name}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Ulasanmu 100% anonim dan dienkripsi dengan SHA-256
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 text-xs"
              >
                ✕
              </button>
            </div>
            <ReviewForm
              initialCompanyId={company.id}
              onSuccess={() => {
                setShowReviewModal(false);
                loadData();
              }}
              onCancel={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      )}

      {/* Claim Company Modal */}
      {company && (
        <ClaimModal
          companyId={company.id}
          companyName={company.name}
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
