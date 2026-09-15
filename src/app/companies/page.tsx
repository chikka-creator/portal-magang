"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import CompanyCard from "@/components/CompanyCard";
import FilterPanel from "@/components/FilterPanel";
import type { Company } from "@/lib/types";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [minStipend, setMinStipend] = useState(0);
  const [maxStipend, setMaxStipend] = useState(1500000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("reviews");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    async function loadCompanies() {
      try {
        setLoading(true);
        let url = "/api/companies?";
        if (selectedIndustry !== "all") {
          url += `industry=${encodeURIComponent(selectedIndustry)}&`;
        }
        if (searchQuery.trim()) {
          url += `search=${encodeURIComponent(searchQuery.trim())}&`;
        }
        if (minStipend > 0) {
          url += `min_stipend=${minStipend}&`;
        }
        if (maxStipend < 1500000) {
          url += `max_stipend=${maxStipend}&`;
        }
        if (minRating > 0) {
          url += `min_rating=${minRating}&`;
        }
        url += `sort_by=${sortBy}&sort_order=${sortOrder}`;

        const res = await fetch(url);
        const json = await res.json();
        if (json.success) {
          setCompanies(json.data);
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, [
    selectedIndustry,
    searchQuery,
    minStipend,
    maxStipend,
    minRating,
    sortBy,
    sortOrder,
  ]);

  const handleResetFilters = () => {
    setMinStipend(0);
    setMaxStipend(1500000);
    setMinRating(0);
    setSortBy("reviews");
    setSortOrder("desc");
  };

  const industries = [
    { id: "all", label: "Semua Sektor" },
    { id: "Teknologi", label: "Teknologi & IT" },
    { id: "Telekomunikasi", label: "Telekomunikasi" },
    { id: "Manufaktur", label: "Manufaktur" },
    { id: "Logistik & Maritim", label: "Logistik & Pelabuhan" },
    { id: "Perkapalan & Pertahanan", label: "Perkapalan" },
    { id: "Konstruksi & Material", label: "Konstruksi" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* 1. Static Sidebar */}
      <Sidebar />

      {/* 2. Independently Scrollable Main Area */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
          {/* Header */}
          <div className="pt-12 lg:pt-0">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
              Daftar Perusahaan Mitra Magang
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Tempat Prakerin/PKL SMK di Surabaya & sekitarnya yang telah direview oleh para siswa.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="w-full md:max-w-md flex items-center gap-2">
                <div className="flex-1">
                  <SearchBar
                    placeholder="Cari nama perusahaan..."
                    onSelect={(c) => setSearchQuery(c.name)}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    showFilters || minStipend > 0 || minRating > 0
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                  title="Filter Lanjutan"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="hidden sm:inline">Filter</span>
                </button>
              </div>

              {/* Industry Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {industries.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndustry(ind.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      selectedIndustry === ind.id
                        ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm"
                        : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]"
                    }`}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expandable Advanced Filter Panel */}
            {showFilters && (
              <FilterPanel
                minStipend={minStipend}
                maxStipend={maxStipend}
                minRating={minRating}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onMinStipendChange={setMinStipend}
                onMaxStipendChange={setMaxStipend}
                onMinRatingChange={setMinRating}
                onSortChange={(by, ord) => {
                  setSortBy(by);
                  setSortOrder(ord);
                }}
                onReset={handleResetFilters}
              />
            )}
          </div>

          {/* Company Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="h-48 rounded-lg skeleton" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
              <p className="text-sm text-[var(--text-muted)]">
                Tidak ada perusahaan yang cocok dengan kriteria pencarian dan filter Anda.
              </p>
              <button
                onClick={() => {
                  setSelectedIndustry("all");
                  setSearchQuery("");
                  handleResetFilters();
                }}
                className="mt-3 text-xs text-primary underline"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {companies.map((company, i) => (
                <CompanyCard key={company.id} company={company as any} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
