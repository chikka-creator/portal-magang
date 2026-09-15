"use client";

import React, { useState, useRef, useEffect } from "react";

export default function ExportButton() {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "json">("csv");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exportItems = [
    {
      type: "companies",
      title: "Daftar Perusahaan",
      desc: "Semua mitra, kota, industri, rating, dan saku",
      icon: (
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      badgeBg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      type: "reviews",
      title: "Ulasan Siswa Publik",
      desc: "Uang saku, lingkungan, mentor, dan testimoni",
      icon: (
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badgeBg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      type: "analytics",
      title: "Ringkasan Analitik",
      desc: "Agregasi perbandingan tren dan rata-rata industri",
      icon: (
        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badgeBg: "bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={ref}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-all duration-200 outline-none ${
          open
            ? "bg-[var(--accent-tint)] border-[var(--border-focus)] text-[var(--text-primary)] shadow-sm"
            : "bg-[var(--bg-card)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--accent-tint)]"
        }`}
        aria-expanded={open}
      >
        <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Ekspor Data</span>
        <svg
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Modern Popover Menu */}
      {open && (
        <div
          className="absolute right-0 mt-2.5 w-[330px] max-w-[calc(100vw-32px)] bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-hover)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Header & Format Switcher */}
          <div className="p-3.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/40 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-[var(--text-primary)] block">
                Unduh Dataset
              </span>
              <span className="text-[10.5px] text-[var(--text-muted)]">
                Format file yang dipilih:
              </span>
            </div>

            {/* CSV vs JSON Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setSelectedFormat("csv")}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  selectedFormat === "csv"
                    ? "bg-[var(--accent-tint)] text-[var(--text-primary)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat("json")}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  selectedFormat === "json"
                    ? "bg-[var(--accent-tint)] text-[var(--text-primary)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                JSON
              </button>
            </div>
          </div>

          {/* Export Items List */}
          <div className="p-1.5 divide-y divide-[var(--border-primary)]">
            {exportItems.map((item) => {
              const downloadUrl = `/api/export?type=${item.type}&format=${selectedFormat}`;

              return (
                <a
                  key={item.type}
                  href={downloadUrl}
                  download
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--accent-tint)] transition-all duration-150"
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${item.badgeBg}`}
                  >
                    {item.icon}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:border-[var(--border-hover)]">
                        .{selectedFormat}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5 truncate">
                      {item.desc}
                    </p>
                  </div>

                  {/* Download Arrow Indicator */}
                  <div className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-y-0.5 transition-all flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="p-2.5 bg-[var(--bg-secondary)]/30 border-t border-[var(--border-primary)] text-center">
            <span className="text-[10.5px] text-[var(--text-muted)] flex items-center justify-center gap-1">
              <span>🔒 Transparansi publik</span>
              <span>•</span>
              <span>Data pribadi siswa 100% terlindungi</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
