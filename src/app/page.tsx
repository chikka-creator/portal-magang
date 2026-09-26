"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
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
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedDayTab, setSelectedDayTab] = useState<"today" | "popular" | "stipend">("today");

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
      if (companiesJson.success) setTrending(companiesJson.data.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSort]);

  const handleChipClick = (promptText: string, sortKey?: string) => {
    setAiPrompt(promptText);
    if (sortKey) {
      setActiveSort(sortKey);
    }
  };

  // Mocked upcoming agenda items matching Lima AI format
  const upcomingEvents = [
    {
      time: "10:00",
      title: "Batch Pendaftaran Magang Gasik (RPL & TKJ)",
      meta: "4 sekolah mitra • Google Meet",
      type: "meet",
    },
    {
      time: "13:30",
      title: "Q&A Mentor Industri: BUMN & Perkapalan",
      meta: "PT PAL & Telkom • Zoom Live",
      type: "meet",
    },
    {
      time: "16:00",
      title: "Batas Akhir Unggah Laporan Mingguan PKL",
      meta: "Portal Magang • Siswa Aktif",
      type: "task",
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* 1. Lima AI Static Sidebar */}
      <Sidebar />

      {/* 2. Main Workspace Canvas */}
      <main className="flex-1 h-full overflow-y-auto">
        {/* Top Header / Breadcrumbs Bar (Matching Lima AI header) */}
        <header className="sticky top-0 z-20 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-primary)] px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-0 pl-10 lg:pl-0">
            <span className="text-[var(--text-secondary)] font-medium truncate">Surabaya Studio</span>
            <span>›</span>
            <span className="text-[var(--text-primary)] font-semibold">Home</span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block w-48 lg:w-64">
              <SearchBar
                placeholder="Cari sesuatu..."
                onSelect={(company) => {
                  window.location.href = `/companies/${company.id}`;
                }}
              />
            </div>

            <button
              onClick={() => handleChipClick("Rekomendasikan tempat magang terbaik untuk siswa SMK di Surabaya")}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
            >
              <span className="text-amber-600 dark:text-amber-400">☆</span>
              <span>Ask AI</span>
            </button>

            <ExportButton />

            <button
              onClick={() => setShowReviewModal(true)}
              className="btn-primary text-xs py-1.5 px-3 shadow-xs"
            >
              + Create
            </button>

            {/* Profile circular avatar (Moss green circle 'A') */}
            <div className="w-7 h-7 rounded-full bg-[#43553E] text-[#F4F1EA] flex items-center justify-center font-bold text-xs flex-shrink-0 ml-1">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="max-w-6xl mx-auto p-4 sm:p-7 space-y-6 pb-16">
          {/* Greeting Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
                Good morning, Alex.
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Transparansi Prakerin & Evaluasi Tempat Magang SMK Surabaya
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <Link
                href="/matchmaker"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--accent-tint)] transition-all shadow-2xs"
              >
                <span>☆</span>
                <span>Find your workflow</span>
              </Link>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Monday, Aug 17</p>
                <p className="text-[11px] text-[var(--text-muted)]">Surabaya Studio - Pro Plan</p>
              </div>
            </div>
          </div>

          {/* AI Prompt Input Box (Signature Lima AI Component) */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-[var(--text-muted)] text-sm">☆</span>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiPrompt.trim()) {
                    window.location.href = `/companies?search=${encodeURIComponent(aiPrompt.trim())}`;
                  }
                }}
                placeholder="Ask Lima anything about your work & internship search..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <button
                  type="button"
                  className="p-1 hover:text-[var(--text-primary)] transition-colors"
                  title="Voice prompt"
                  onClick={() => handleChipClick("Rekomendasi tempat magang RPL di Surabaya")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1 hover:text-[var(--text-primary)] transition-colors"
                  title="Attachment / Filter"
                  onClick={() => {
                    window.location.href = "/companies";
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => handleChipClick("Rencana magang saya hari ini", "created_at")}
                className="pill-chip text-xs whitespace-nowrap"
              >
                Plan my day
              </button>
              <button
                type="button"
                onClick={() => handleChipClick("Ringkasan kompensasi uang saku magang", "stipend_amount")}
                className="pill-chip text-xs whitespace-nowrap"
              >
                Summarize my work
              </button>
              <button
                type="button"
                onClick={() => handleChipClick("Cari perusahaan dengan bimbingan mentor terbaik", "environment_score")}
                className="pill-chip text-xs whitespace-nowrap"
              >
                Find something
              </button>
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="pill-chip text-xs whitespace-nowrap"
              >
                Create something
              </button>
            </div>
          </div>

          {/* 4-Column Metric Bar with Thin Vertical Dividers (Exact Lima AI Design) */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-xs grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--border-primary)]">
            {/* Col 1 */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-[var(--text-primary)]">
                  {stats?.total_companies ?? "5"}
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  TASKS TODAY
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">3 urgent</p>
            </div>

            {/* Col 2 */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-[var(--text-primary)]">
                  {stats?.total_reviews ?? "2"}
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  MEETINGS
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Next: 10:00 AM</p>
            </div>

            {/* Col 3 */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-[var(--text-primary)]">
                  1
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  OVERDUE
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Product Launch</p>
            </div>

            {/* Col 4 */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-[var(--text-primary)]">
                  3
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  AI SUGGESTIONS
                </span>
              </div>
              <Link href="/companies" className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-1 inline-block transition-colors">
                View all →
              </Link>
            </div>
          </div>

          {/* Two-Column Split Section (Matching Lima AI 'MY DAY' vs 'UPCOMING') */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols wide: '■ MY DAY' style) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Section Header with '■ MY DAY' & Toggle Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  <span className="text-[8px]">■</span>
                  <span>MY DAY</span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-primary)]">
                  <button
                    type="button"
                    onClick={() => setSelectedDayTab("today")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedDayTab === "today"
                        ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDayTab("popular")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedDayTab === "popular"
                        ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDayTab("stipend")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedDayTab === "stipend"
                        ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {/* Task-Styled Target List (Identical to Lima AI wireframe items) */}
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] divide-y divide-[var(--border-primary)] shadow-xs">
                {/* Task Item 1 */}
                <Link
                  href={trending[0] ? `/companies/${trending[0].id}` : "/companies"}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[var(--bg-card-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--accent-primary)] focus:ring-0 accent-[#18181A]"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Status Dot: Terracotta */}
                    <span className="w-2 h-2 rounded-full bg-[#B85338] flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate group-hover:underline">
                      {trending[0]?.name ?? "PT Telkom Indonesia (Witel Jatim)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="badge-sage text-[10px] hidden sm:inline-flex items-center gap-0.5">
                      <span>★</span> AI
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      Today, 3:00 PM
                    </span>
                  </div>
                </Link>

                {/* Task Item 2 */}
                <Link
                  href={trending[1] ? `/companies/${trending[1].id}` : "/companies"}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[var(--bg-card-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--accent-primary)] focus:ring-0 accent-[#18181A]"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Status Dot: Sage */}
                    <span className="w-2 h-2 rounded-full bg-[#43553E] flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate group-hover:underline">
                      {trending[1]?.name ?? "PT PAL Indonesia (Persero) - Galangan Kapal"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      Today, 5:00 PM
                    </span>
                  </div>
                </Link>

                {/* Task Item 3 */}
                <Link
                  href={trending[2] ? `/companies/${trending[2].id}` : "/companies"}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[var(--bg-card-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--accent-primary)] focus:ring-0 accent-[#18181A]"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Status Dot: Warm Slate */}
                    <span className="w-2 h-2 rounded-full bg-[#76746D] flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate group-hover:underline">
                      {trending[2]?.name ?? "Bank Jatim - Divisi Teknologi & Sistem Informasi"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      Today
                    </span>
                  </div>
                </Link>

                {/* Add Task Button inside card footer */}
                <div className="p-3 bg-[var(--accent-tint)]/50">
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium transition-colors"
                  >
                    <span>+</span>
                    <span>Add task / Tulis Ulasan Baru</span>
                  </button>
                </div>
              </div>

              {/* Feed: Ulasan Magang Terbaru Siswa */}
              <div className="pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    <span className="text-[8px]">■</span>
                    <span>FEED ULASAN TERBARU</span>
                  </div>

                  {/* Filter tabs for reviews */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveSort("created_at")}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        activeSort === "created_at"
                          ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Terbaru
                    </button>
                    <button
                      onClick={() => setActiveSort("stipend_amount")}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        activeSort === "stipend_amount"
                          ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Uang Saku
                    </button>
                    <button
                      onClick={() => setActiveSort("environment_score")}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                        activeSort === "environment_score"
                          ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Skor Mentor
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-36 rounded-xl skeleton" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                    <p className="text-xs text-[var(--text-muted)]">Belum ada review yang tersedia.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.slice(0, 4).map((rev, idx) => (
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

            {/* Right Column (1 Col wide: '■ UPCOMING' style) */}
            <div className="space-y-4">
              {/* Header with '■ UPCOMING' */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                <span className="text-[8px]">■</span>
                <span>UPCOMING</span>
              </div>

              {/* Timeline Card */}
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 shadow-xs space-y-4">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="space-y-1 group">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-primary)] font-mono">
                        {event.time}
                      </span>
                      {event.type === "meet" && (
                        <svg className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">
                      {event.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {event.meta}
                    </p>
                  </div>
                ))}

                <div className="pt-2 border-t border-[var(--border-primary)]">
                  <Link
                    href="/companies"
                    className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
                  >
                    <span>View calendar</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Section: ■ MITRA PILIHAN */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    <span className="text-[8px]">■</span>
                    <span>TOP PICKS</span>
                  </div>
                  <Link href="/companies" className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    All ({stats?.total_companies ?? 5}) →
                  </Link>
                </div>

                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] divide-y divide-[var(--border-primary)] shadow-xs">
                  {trending.slice(0, 3).map((comp) => (
                    <Link
                      key={comp.id}
                      href={`/companies/${comp.id}`}
                      className="p-3 flex items-center justify-between gap-2 hover:bg-[var(--bg-card-hover)] transition-colors block"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {comp.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {comp.city} • {comp.industry ?? "Teknologi"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-semibold text-[var(--accent-sage)] font-mono">
                          {formatRupiah((comp as any).avg_stipend ?? 550000)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: ■ AI BRIEFING & ■ AUTOMATIONS (Exact Lima AI bottom blocks) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* AI Briefing Card */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                <span className="text-[8px]">■</span>
                <span>AI BRIEFING</span>
              </div>
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="badge-sage text-[10px]">Intel Mingguan</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Update otomatis dari 12 ulasan siswa</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Perusahaan di sektor Telekomunikasi & Perkapalan Surabaya mencatat skor kepuasan mentor tertinggi (4.8/5.0). Uang saku rata-rata mengalami kenaikan 15% untuk posisi Junior Developer & QA Intern.
                </p>
                <div className="pt-2 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                  <span>✓ 100% Data Anonim</span>
                  <span>•</span>
                  <span>Tervalidasi NISN Siswa</span>
                </div>
              </div>
            </div>

            {/* Automations Card */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                <span className="text-[8px]">■</span>
                <span>AUTOMATIONS & WORKFLOW</span>
              </div>
              <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    Smart Match Rekomendasi Magang
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Sistem otomatis mencocokkan kualifikasi jurusan SMK Anda (RPL, TKJ, MM, Akuntansi) dengan lowongan prakerin yang ramah pemula dan berbayar.
                </p>
                <div className="pt-2">
                  <Link
                    href="/matchmaker"
                    className="text-xs font-medium text-[var(--text-primary)] hover:underline inline-flex items-center gap-1"
                  >
                    Buka AI Matchmaker →
                  </Link>
                </div>
              </div>
            </div>
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
                  Bagikan pengalamanmu untuk membantu rekan siswa SMK lainnya
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
