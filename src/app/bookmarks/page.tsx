"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import CompanyCard from "@/components/CompanyCard";
import { useBookmarks } from "@/lib/bookmark";

export default function BookmarksPage() {
  const { bookmarks } = useBookmarks();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarkedCompanies = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/companies");
        if (res.ok) {
          const data = await res.json();
          const all = data.companies || [];
          const filtered = all.filter((c: any) => bookmarks.includes(c.id));
          setCompanies(filtered);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedCompanies();
  }, [bookmarks]);

  // Aggregate metrics
  const totalSaved = companies.length;
  const avgStipend =
    totalSaved > 0
      ? Math.round(
          companies.reduce((acc, c) => acc + (Number(c.avg_stipend) || 0), 0) /
            totalSaved
        )
      : 0;

  return (
    <div className="flex h-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Wishlist Pribadi
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {totalSaved} Tersimpan
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Perusahaan Favorit Saya
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Daftar tempat magang yang kamu tandai untuk dipertimbangkan sebelum mendaftar prakerin.
            </p>
          </div>

          {totalSaved > 0 && (
            <div className="flex items-center gap-2">
              <Link
                href="/compare"
                className="px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-xs hover:opacity-90 transition-opacity"
              >
                Bandingkan Opsi Favorit →
              </Link>
            </div>
          )}
        </div>

        {/* Summary Metric Cards */}
        {totalSaved > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-lg">
                ❤️
              </div>
              <div>
                <span className="text-[11px] text-[var(--text-muted)] block">Total Tersimpan</span>
                <span className="text-lg font-extrabold text-[var(--text-primary)]">{totalSaved} Tempat Magang</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">
                💰
              </div>
              <div>
                <span className="text-[11px] text-[var(--text-muted)] block">Rata-rata Uang Saku Pilihan</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  Rp {avgStipend.toLocaleString("id-ID")}/bln
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid / Empty */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[var(--text-muted)]">
            Memuat daftar wishlist...
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 px-6 text-center rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-card)] max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-tint)] flex items-center justify-center mx-auto text-2xl">
              🤍
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Belum Ada Perusahaan Ditandai
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Klik ikon hati di kartu perusahaan mana saja untuk menyimpannya ke wishlist pribadi kamu.
            </p>

            <div className="pt-2">
              <Link
                href="/companies"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-xs hover:opacity-90 transition-opacity"
              >
                Cari Perusahaan Magang →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
