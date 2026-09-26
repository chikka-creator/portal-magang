"use client";

import React from "react";
import { formatRupiah } from "@/lib/format";

interface FilterPanelProps {
  minStipend: number;
  maxStipend: number;
  minRating: number;
  sortBy: string;
  sortOrder: string;
  onMinStipendChange: (val: number) => void;
  onMaxStipendChange: (val: number) => void;
  onMinRatingChange: (val: number) => void;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onReset: () => void;
}

export default function FilterPanel({
  minStipend,
  maxStipend,
  minRating,
  sortBy,
  sortOrder,
  onMinStipendChange,
  onMaxStipendChange,
  onMinRatingChange,
  onSortChange,
  onReset,
}: FilterPanelProps) {
  const isFiltered =
    minStipend > 0 ||
    maxStipend < 1500000 ||
    minRating > 0 ||
    sortBy !== "reviews";

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] p-4 sm:p-5 space-y-4 animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-[8px]">■</span>
          <span>Filter Lanjutan</span>
        </h4>
        {isFiltered && (
          <button
            onClick={onReset}
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline transition-colors"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* 1. Uang Saku Range Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-muted)] font-medium">Uang Saku Min.</span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {formatRupiah(minStipend)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1500000}
            step={50000}
            value={minStipend}
            onChange={(e) => onMinStipendChange(Number(e.target.value))}
            className="w-full accent-[#18181A] h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
            <span>Rp 0</span>
            <span>Rp 1.5jt+</span>
          </div>
        </div>

        {/* 2. Rating Minimal */}
        <div className="space-y-2">
          <span className="block text-[var(--text-muted)] font-medium">Rating Minimum</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 3, 3.5, 4, 4.5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onMinRatingChange(val)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  minRating === val
                    ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                    : "bg-[var(--accent-tint)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {val === 0 ? "Semua" : `★ ${val}+`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Urutkan Berdasarkan */}
        <div className="space-y-2">
          <span className="block text-[var(--text-muted)] font-medium">Urutkan</span>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value, sortOrder)}
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            >
              <option value="reviews">Jumlah Ulasan</option>
              <option value="stipend">Uang Saku Tertinggi</option>
              <option value="environment">Skor Lingkungan</option>
              <option value="mentorship">Skor Mentorship</option>
            </select>
            <button
              type="button"
              onClick={() => onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc")}
              className="p-1.5 rounded-md border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title={sortOrder === "asc" ? "Urutan Naik" : "Urutan Turun"}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
