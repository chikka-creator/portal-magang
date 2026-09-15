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
    <div className="glass-card p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter Lanjutan
        </h4>
        {isFiltered && (
          <button
            onClick={onReset}
            className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* 1. Uang Saku Range Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Uang Saku Min.</span>
            <span className="font-mono font-semibold text-foreground">
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
            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>Rp 0</span>
            <span>Rp 1.5jt+</span>
          </div>
        </div>

        {/* 2. Rating Minimal */}
        <div className="space-y-2">
          <span className="block text-muted-foreground font-medium">Rating Minimum</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 3, 3.5, 4, 4.5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onMinRatingChange(val)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  minRating === val
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {val === 0 ? "Semua" : `★ ${val}+`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Urutkan Berdasarkan */}
        <div className="space-y-2">
          <span className="block text-muted-foreground font-medium">Urutkan Hasil</span>
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [by, ord] = e.target.value.split("_");
              onSortChange(by, ord);
            }}
            className="w-full px-3 py-1.5 bg-background border border-input rounded-md text-foreground text-xs"
          >
            <option value="reviews_desc">Ulasan Terbanyak</option>
            <option value="rating_desc">Rating Tertinggi (★)</option>
            <option value="stipend_desc">Uang Saku Tertinggi (Rp)</option>
            <option value="name_asc">Nama Perusahaan (A - Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
