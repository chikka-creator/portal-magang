"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import CompanyCard from "@/components/CompanyCard";
import ExportButton from "@/components/ExportButton";
import { formatRupiah } from "@/lib/format";
import type { ReviewPublic, DashboardStats, Company } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [trending, setTrending] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<string>("created_at");
  const [showReviewModal, setShowReviewModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reviewsRes, companiesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch(`/api/reviews?sort=${activeSort}&order=desc&limit=15`),
        fetch("/api/companies"),
      ]);

      const [statsJson, reviewsJson, companiesJson] = await Promise.all([
        statsRes.json(),
        reviewsRes.json(),
        companiesRes.json(),
      ]);

      if (statsJson.success) setStats(statsJson.data);
      if (reviewsJson.success) setReviews(reviewsJson.data);
      if (companiesJson.success) setTrending(companiesJson.data.slice(0, 4));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSort]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* 1. Static Sidebar (Fixed Navigation) */}
      <Sidebar />

      {/* 2. Independently Scrollable Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
          {/* Top Bar with Search & Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-12 lg:pt-0">
            <div className="flex-1 max-w-md">
              <SearchBar
                placeholder="Cari perusahaan di Surabaya..."
                onSelect={(company) => {
                  window.location.href = `/companies/${company.id}`;
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <ExportButton />
              <button
                onClick={() => setShowReviewModal(true)}
                className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm"
              >
                + Tulis Ulasan Magang
              </button>
            </div>
          </div>

          {/* Minimalist Hero Section with Metrics */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-6 sm:p-7">
            <div className="max-w-2xl">
              <span className="badge-neutral text-[11px] mb-3 inline-block">
                Transparansi Prakerin SMK Surabaya
              </span>
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
                Reputasi & Kompensasi Magang SMK
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Platform transparansi anonim untuk siswa SMK. Lihat penilaian objektif mengenai lingkungan kerja, bimbingan mentor, dan uang saku nyata di Surabaya.
              </p>
            </div>

            {/* Clean Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[var(--border-primary)]">
              <div className="p-3 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-primary)]">
                <p className="text-[11px] text-[var(--text-muted)] font-medium">Perusahaan Mitra</p>
                <p className="text-lg font-semibold text-[var(--text-primary)] font-mono mt-0.5">
                  {stats?.total_companies ?? "8"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-primary)]">
                <p className="text-[11px] text-[var(--text-muted)] font-medium">Ulasan Masuk</p>
                <p className="text-lg font-semibold text-[var(--text-primary)] font-mono mt-0.5">
                  {stats?.total_reviews ?? "12"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-primary)]">
                <p className="text-[11px] text-[var(--text-muted)] font-medium">Rata-rata Uang Saku</p>
                <p className="text-lg font-semibold text-[var(--text-primary)] font-mono mt-0.5">
                  {stats?.avg_stipend ? formatRupiah(stats.avg_stipend) : "Rp 550.000"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-primary)]">
                <p className="text-[11px] text-[var(--text-muted)] font-medium">Skor Lingkungan</p>
                <p className="text-lg font-semibold text-[var(--text-primary)] font-mono mt-0.5">
                  ★ {stats?.avg_environment ? stats.avg_environment.toFixed(1) : "4.3"} <span className="text-xs text-[var(--text-muted)] font-normal">/ 5</span>
                </p>
              </div>
            </div>
          </div>

          {/* Section: Perusahaan Pilihan */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                  Perusahaan Mitra Magang
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Tempat Prakerin/PKL di wilayah Surabaya dan sekitarnya
                </p>
              </div>
              <a
                href="/companies"
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Lihat Semua ({stats?.total_companies ?? 8}) →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {trending.map((company, idx) => (
                <CompanyCard
                  key={company.id}
                  id={company.id}
                  name={company.name}
                  city={company.city}
                  industry={company.industry}
                  review_count={(company as any).review_count ?? 3}
                  avg_environment={(company as any).avg_environment ?? 4.3}
                  avg_mentorship={(company as any).avg_mentorship ?? 4.0}
                  avg_stipend={(company as any).avg_stipend ?? 500000}
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Section: Feed Review Terbaru */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
                  Ulasan Magang Terbaru
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Pengalaman nyata langsung dari siswa SMK
                </p>
              </div>

              {/* Minimalist Sorting Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] self-start sm:self-auto">
                <button
                  onClick={() => setActiveSort("created_at")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeSort === "created_at"
                      ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Terbaru
                </button>
                <button
                  onClick={() => setActiveSort("stipend_amount")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeSort === "stipend_amount"
                      ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Uang Saku
                </button>
                <button
                  onClick={() => setActiveSort("environment_score")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeSort === "environment_score"
                      ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Skor Tertinggi
                </button>
                <button
                  onClick={() => setActiveSort("helpful_count")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeSort === "helpful_count"
                      ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Bermanfaat
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-44 rounded-xl skeleton" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                <p className="text-xs text-[var(--text-muted)]">Belum ada review yang tersedia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reviews.map((rev, idx) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    index={idx}
                    showCompanyName={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Submission Modal */}
      {showReviewModal && (
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
                  Tulis Ulasan Magang Anonim
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Bagikan pengalamanmu untuk membantu rekan siswa lainnya
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
              onSuccess={() => {
                setShowReviewModal(false);
                fetchData();
              }}
              onCancel={() => setShowReviewModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
