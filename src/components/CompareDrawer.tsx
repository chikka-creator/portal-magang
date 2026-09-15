"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCompare, clearCompareList } from "@/lib/compare";

export default function CompareDrawer() {
  const { compareList, toggleCompare } = useCompare();
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    if (compareList.length === 0) {
      setCompanies([]);
      return;
    }

    const fetchCompanyNames = async () => {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const data = await res.json();
          const list = (data.companies || []).filter((c: any) =>
            compareList.includes(c.id)
          );
          setCompanies(list);
        }
      } catch {
        // ignore
      }
    };

    fetchCompanyNames();
  }, [compareList]);

  if (compareList.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl p-3 sm:p-4 rounded-2xl border border-[var(--border-hover)] bg-[var(--bg-card)]/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
      style={{
        boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-primary)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)] flex-shrink-0">
            📊 {compareList.length}/3
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
              Bandingkan Perusahaan
            </h4>
            <p className="text-[10.5px] text-[var(--text-muted)] truncate">
              {companies.map((c) => c.name).join(" vs ") || `${compareList.length} dipilih`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => clearCompareList()}
            className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1.5 rounded-md hover:bg-[var(--accent-tint)] transition-colors"
          >
            Hapus
          </button>
          <Link
            href="/compare"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-xs hover:opacity-90 transition-opacity shadow-sm"
          >
            <span>Bandingkan ({compareList.length})</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
