"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import ExportButton from "@/components/ExportButton";
import { formatRupiah } from "@/lib/format";
import type { ReviewPublic, DashboardStats, Company, UpcomingEvent, AiBriefing, AiSearchResult } from "@/lib/types";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatDateId(): string {
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [trending, setTrending] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<string>("created_at");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedDayTab, setSelectedDayTab] = useState<"today" | "upcoming" | "completed">("today");

  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [aiBriefing, setAiBriefing] = useState<AiBriefing | null>(null);
  const [aiSearchResults, setAiSearchResults] = useState<AiSearchResult[]>([]);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [todayCompanies, setTodayCompanies] = useState<Company[]>([]);
  const [upcomingCompanies, setUpcomingCompanies] = useState<Company[]>([]);
  const [completedCompanies, setCompletedCompanies] = useState<Company[]>([]);
  const [todoCompanies, setTodoCompanies] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const aiSearchRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reviewsRes, companiesRes, eventsRes, briefingRes] = await Promise.all([
        fetch("/api/stats"),
        fetch(`/api/reviews?sort=${activeSort}&order=desc&limit=15`),
        fetch("/api/companies"),
        fetch("/api/events?limit=5"),
        fetch("/api/ai-briefing"),
      ]);

      const [statsJson, reviewsJson, companiesJson, eventsJson, briefingJson] = await Promise.all([
        statsRes.json(),
        reviewsRes.json(),
        companiesRes.json(),
        eventsRes.json(),
        briefingRes.json(),
      ]);

      if (statsJson.success) setStats(statsJson.data);
      if (reviewsJson.success) setReviews(reviewsJson.data);
      if (companiesJson.success) setTrending(companiesJson.data.slice(0, 5));
      if (eventsJson.success) setUpcomingEvents(eventsJson.data);
      if (briefingJson.success) setAiBriefing(briefingJson.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodoCompanies = useCallback(async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const [todayRes, upcomingRes, completedRes] = await Promise.all([
        fetch(`/api/reviews?sort=created_at&order=desc&limit=5`),
        fetch(`/api/reviews?sort=created_at&order=desc&limit=10`),
        fetch(`/api/companies?sort_by=reviews&sort_order=desc&limit=5`),
      ]);

      const [todayJson, upcomingJson, completedJson] = await Promise.all([
        todayRes.json(),
        upcomingRes.json(),
        completedRes.json(),
      ]);

      if (todayJson.success) {
        const todayReviews = todayJson.data.filter((r: ReviewPublic) => {
          const d = new Date(r.created_at);
          return d >= todayStart;
        });
        const todayCompanyIds = new Set(todayReviews.map((r: any) => r.company_id));
        const uniqueToday = trending.filter(c => todayCompanyIds.has(c.id));
        setTodayCompanies(uniqueToday.length > 0 ? uniqueToday.slice(0, 5) : trending.slice(0, 3));
      }
      if (upcomingJson.success) {
        const upcomingReviews = upcomingJson.data.filter((r: ReviewPublic) => {
          const d = new Date(r.created_at);
          return d < todayStart && d >= weekStart;
        });
        const upcomingCompanyIds = new Set(upcomingReviews.map((r: any) => r.company_id));
        const uniqueUpcoming = trending.filter(c => upcomingCompanyIds.has(c.id));
        setUpcomingCompanies(uniqueUpcoming.length > 0 ? uniqueUpcoming.slice(0, 5) : trending.slice(0, 3));
      }
      if (completedJson.success) {
        setCompletedCompanies(completedJson.data.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to load todo companies:", err);
    }
  }, [trending]);

  useEffect(() => {
    fetchData();
  }, [activeSort]);

  useEffect(() => {
    if (trending.length > 0) fetchTodoCompanies();
  }, [trending, fetchTodoCompanies]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (aiSearchRef.current && !aiSearchRef.current.contains(e.target as Node)) {
        setAiSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChipClick = (promptText: string, sortKey?: string) => {
    setAiPrompt(promptText);
    if (sortKey) {
      setActiveSort(sortKey);
    }
    handleAiSearch(promptText);
  };

  const handleAiSearch = async (query: string) => {
    if (!query.trim()) return;
    setAiSearchLoading(true);
    setAiSearchOpen(true);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success) setAiSearchResults(data.data);
    } catch (err) {
      console.error("AI search failed:", err);
    } finally {
      setAiSearchLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung voice input. Gunakan Chrome atau Edge.");
      return;
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setAiPrompt(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  };

  const toggleTodo = (companyId: string) => {
    setTodoCompanies(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  const getTabCompanies = () => {
    switch (selectedDayTab) {
      case "today": return todayCompanies;
      case "upcoming": return upcomingCompanies;
      case "completed": return completedCompanies;
      default: return todayCompanies;
    }
  };

  const tabCompanies = getTabCompanies();

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
                {getGreeting()}, Alex.
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
                <p className="text-xs font-semibold text-[var(--text-primary)]">{formatDateId()}</p>
                <p className="text-[11px] text-[var(--text-muted)]">Surabaya Studio - Pro Plan</p>
              </div>
            </div>
          </div>

          {/* AI Prompt Input Box (Signature Lima AI Component) */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-3.5 sm:p-4 shadow-xs space-y-3 relative" ref={aiSearchRef}>
            <div className="flex items-center gap-2.5">
              <span className="text-[var(--text-muted)] text-sm">☆</span>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && aiPrompt.trim()) {
                    handleAiSearch(aiPrompt);
                  }
                }}
                placeholder="Ask Lima anything about your work & internship search..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <button
                  type="button"
                  className={`p-1 transition-colors ${isListening ? "text-red-500 animate-pulse" : "hover:text-[var(--text-primary)]"}`}
                  title="Voice prompt"
                  onClick={startVoiceInput}
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

            {/* AI Search Results Dropdown */}
            {aiSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hover)] shadow-xl p-3 space-y-2 max-h-80 overflow-y-auto">
                {aiSearchLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2">
                    <div className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    <span className="text-xs text-[var(--text-muted)]">Mencari perusahaan terbaik...</span>
                  </div>
                ) : aiSearchResults.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-[var(--text-muted)]">Tidak ditemukan perusahaan yang cocok.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium">{aiSearchResults.length} perusahaan ditemukan</p>
                    {aiSearchResults.map((r) => (
                      <Link
                        key={r.id}
                        href={`/companies/${r.id}`}
                        className="block p-2.5 rounded-lg hover:bg-[var(--accent-tint)] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">{r.name}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">{r.city} · {r.industry}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                              {r.confidence}%
                            </span>
                          </div>
                        </div>
                        {r.matchReasons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {r.matchReasons.slice(0, 3).map((reason, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 4-Column Metric Bar with Thin Vertical Dividers (Exact Lima AI Design) */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-xs grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--border-primary)]">
            {/* Col 1: Total Perusahaan */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-[var(--text-primary)]">
                  {stats?.total_companies ?? "—"}
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  PERUSAHAAN
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Terdaftar di portal</p>
            </div>

            {/* Col 2: Total Ulasan */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-[var(--text-primary)]">
                  {stats?.total_reviews ?? "—"}
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  ULASAN
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Dari siswa SMK</p>
            </div>

            {/* Col 3: Skor Rata-rata */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-[var(--text-primary)]">
                  {stats ? ((stats.avg_environment + stats.avg_mentorship) / 2).toFixed(1) : "—"}
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  SKOR RATA-RATA
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Lingkungan + Mentor</p>
            </div>

            {/* Col 4: Uang Saku Rata-rata */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-sans text-[var(--text-primary)]">
                  {stats ? formatRupiah(stats.avg_stipend) : "—"}
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-secondary)]">
                  RATA-RATA SAKU
                </span>
              </div>
              <Link href="/companies?sort_by=stipend&sort_order=desc" className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-1 inline-block transition-colors">
                Lihat tertinggi →
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
                    onClick={() => setSelectedDayTab("upcoming")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedDayTab === "upcoming"
                        ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDayTab("completed")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedDayTab === "completed"
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
                {tabCompanies.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs text-[var(--text-muted)]">Memuat data...</p>
                  </div>
                ) : (
                  tabCompanies.map((comp, idx) => (
                    <Link
                      key={comp.id}
                      href={`/companies/${comp.id}`}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[var(--bg-card-hover)] transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={todoCompanies.has(comp.id)}
                          onChange={() => toggleTodo(comp.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--accent-primary)] focus:ring-0 accent-[#18181A]"
                        />
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${idx === 0 ? "bg-[#B85338]" : idx === 1 ? "bg-[#43553E]" : "bg-[#76746D]"}`} />
                        <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate group-hover:underline">
                          {comp.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        {idx === 0 && selectedDayTab === "today" && (
                          <span className="badge-sage text-[10px] hidden sm:inline-flex items-center gap-0.5">
                            <span>★</span> AI
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          {selectedDayTab === "today" ? "Hari ini" : selectedDayTab === "upcoming" ? "Mendatang" : "Selesai"}
                        </span>
                      </div>
                    </Link>
                  ))
                )}

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
                {upcomingEvents.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-[var(--text-muted)]">Tidak ada event mendatang.</p>
                  </div>
                ) : (
                  upcomingEvents.map((event) => {
                    const eventDate = new Date(event.event_time);
                    const timeStr = eventDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
                    const dateStr = eventDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
                    return (
                      <div key={event.id} className="space-y-1 group">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--text-primary)] font-mono">
                            {timeStr}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">{dateStr}</span>
                          {event.event_type === "meet" && (
                            <svg className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          {event.event_type === "deadline" && (
                            <svg className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[#B85338]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {event.location || event.description || ""}
                        </p>
                      </div>
                    );
                  })
                )}

                <div className="pt-2 border-t border-[var(--border-primary)]">
                  <Link
                    href="/analytics"
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
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {aiBriefing ? `Update dari ${aiBriefing.totalReviews} ulasan siswa` : "Memuat data..."}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {aiBriefing?.generatedText || "Mengambil data briefing dari server..."}
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
