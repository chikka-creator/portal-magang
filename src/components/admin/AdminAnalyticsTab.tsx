"use client";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/format";

export default function AdminAnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics");
      const json = await res.json();
      if (json.success) {
        setData(json.analytics);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 rounded-xl skeleton" />
          <div className="h-28 rounded-xl skeleton" />
          <div className="h-28 rounded-xl skeleton" />
        </div>
        <div className="h-64 rounded-xl skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-60 rounded-xl skeleton" />
          <div className="h-60 rounded-xl skeleton" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-xs text-[var(--text-muted)] glass-card">
        Gagal memuat data analitik. Silakan coba refresh.
      </div>
    );
  }

  const {
    monthlyTrend = [],
    environmentDist = [],
    mentorshipDist = [],
    topCompanies = [],
    weeklyHeatmap = [],
    qaStats = { total_questions: 0, answered: 0, unanswered: 0 },
    stipendRanges = [],
    recentAdminActions = 0,
  } = data;

  const maxMonthlyCount = Math.max(...monthlyTrend.map((m: any) => m.count), 1);
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const maxDayCount = Math.max(...weeklyHeatmap.map((d: any) => d.count), 1);
  const totalReviewsInDist = environmentDist.reduce((acc: number, cur: any) => acc + cur.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex flex-col justify-between border-l-4 border-indigo-500">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Tanya Jawab (Q&A)
            </span>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {qaStats.total_questions} <span className="text-xs font-normal text-[var(--text-muted)]">pertanyaan</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-[var(--border-primary)]">
            <span className="text-emerald-500 font-medium">
              ✅ {qaStats.answered} Terjawab
            </span>
            <span className="text-amber-500 font-medium">
              ⏳ {qaStats.unanswered} Menunggu
            </span>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col justify-between border-l-4 border-emerald-500">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Aktivitas Admin (7 Hari)
            </span>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {recentAdminActions} <span className="text-xs font-normal text-[var(--text-muted)]">tindakan audit</span>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-3 pt-2 border-t border-[var(--border-primary)]">
            Terekam otomatis di Audit Trail platform
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col justify-between border-l-4 border-purple-500">
          <div>
            <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Tingkat Respon Q&A
            </span>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {qaStats.total_questions > 0
                ? Math.round((qaStats.answered / qaStats.total_questions) * 100)
                : 0}
              %
            </div>
          </div>
          <div className="w-full bg-[var(--accent-tint)] h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${
                  qaStats.total_questions > 0
                    ? Math.round((qaStats.answered / qaStats.total_questions) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              📈 Tren Pengiriman Ulasan Siswa
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Distribusi frekuensi ulasan per bulan (12 bulan terakhir)
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--accent-tint)] px-2 py-1 rounded">
            Total {monthlyTrend.reduce((acc: number, m: any) => acc + m.count, 0)} ulasan
          </span>
        </div>

        {monthlyTrend.length === 0 ? (
          <p className="text-xs text-center py-6 text-[var(--text-muted)]">
            Belum ada histori ulasan per bulan.
          </p>
        ) : (
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end gap-3 sm:gap-6 border-b border-[var(--border-primary)] pb-2">
              {monthlyTrend.map((m: any, idx: number) => {
                const heightPercent = Math.max((m.count / maxMonthlyCount) * 100, 8);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-zinc-900 text-white text-[10px] py-0.5 px-2 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                      {m.count} ulasan
                    </div>
                    {/* Bar */}
                    <div className="w-full flex items-end justify-center h-36">
                      <div
                        className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    {/* Label */}
                    <span className="text-[10px] font-mono text-[var(--text-muted)] transform -rotate-45 sm:rotate-0 mt-1">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Score Distribution & Stipend Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Score Distribution Comparison */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            ⭐ Distribusi Rating (1 - 5 Bintang)
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Perbandingan skor Lingkungan Kerja vs Kualitas Mentorship
          </p>

          <div className="space-y-3 pt-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const env = environmentDist.find((d: any) => d.score === star)?.count || 0;
              const ment = mentorshipDist.find((d: any) => d.score === star)?.count || 0;
              const envPct = Math.round((env / totalReviewsInDist) * 100);
              const mentPct = Math.round((ment / totalReviewsInDist) * 100);

              return (
                <div key={star} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-primary)] font-medium">
                      ★ {star} Bintang
                    </span>
                    <span className="text-[var(--text-muted)] text-[11px]">
                      Lingk: {env} ({envPct}%) • Mentor: {ment} ({mentPct}%)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Environment bar */}
                    <div className="bg-[var(--accent-tint)] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${envPct}%` }}
                        title={`Lingkungan: ${env} ulasan`}
                      />
                    </div>
                    {/* Mentorship bar */}
                    <div className="bg-[var(--accent-tint)] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${mentPct}%` }}
                        title={`Mentorship: ${ment} ulasan`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 text-[11px] text-[var(--text-muted)] border-t border-[var(--border-primary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Lingkungan Kerja
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Mentorship
            </span>
          </div>
        </div>

        {/* Stipend Distribution & Weekly Activity */}
        <div className="space-y-5">
          {/* Stipend Breakdown */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              💰 Distribusi Uang Saku (Stipend)
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Rentang kompensasi magang yang diterima siswa
            </p>

            <div className="space-y-2.5 pt-1">
              {stipendRanges.map((r: any, idx: number) => {
                const totalStipendEntries = stipendRanges.reduce((acc: number, c: any) => acc + c.count, 0) || 1;
                const pct = Math.round((r.count / totalStipendEntries) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[var(--text-primary)]">{r.range}</span>
                      <span className="text-[var(--text-muted)] font-mono text-[11px]">
                        {r.count} ulasan ({pct}%)
                      </span>
                    </div>
                    <div className="bg-[var(--accent-tint)] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Heatmap */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              📅 Aktivitas Mingguan (Heatmap Hari)
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Kepadatan siswa mengisi ulasan berdasarkan hari dalam seminggu
            </p>

            <div className="grid grid-cols-7 gap-2 pt-2 text-center">
              {dayNames.map((name, dow) => {
                const match = weeklyHeatmap.find((d: any) => d.day_of_week === dow);
                const count = match ? match.count : 0;
                const intensity = Math.min(Math.round((count / maxDayCount) * 100), 100);

                return (
                  <div key={dow} className="space-y-1.5">
                    <div
                      className="h-12 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-transform hover:scale-105"
                      style={{
                        backgroundColor:
                          count === 0
                            ? "var(--accent-tint)"
                            : `rgba(99, 102, 241, ${Math.max(intensity / 100, 0.25)})`,
                        color: count > 0 ? "#ffffff" : "var(--text-muted)",
                      }}
                      title={`${name}: ${count} ulasan`}
                    >
                      {count}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Rated Companies Leaderboard */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              🏆 Top 5 Perusahaan Rating Tertinggi
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Berdasarkan gabungan skor ulasan siswa terverifikasi
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-primary)] text-[var(--text-muted)] font-medium">
                <th className="pb-2.5">Peringkat</th>
                <th className="pb-2.5">Perusahaan</th>
                <th className="pb-2.5">Kota</th>
                <th className="pb-2.5">Industri</th>
                <th className="pb-2.5">Total Ulasan</th>
                <th className="pb-2.5">Rata-rata Uang Saku</th>
                <th className="pb-2.5 text-right">Skor Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {topCompanies.map((c: any, index: number) => (
                <tr key={c.id} className="hover:bg-[var(--accent-tint)] transition-colors">
                  <td className="py-3 font-bold font-mono">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && `#${index + 1}`}
                  </td>
                  <td className="py-3 font-semibold text-[var(--text-primary)]">
                    {c.name}
                  </td>
                  <td className="py-3 text-[var(--text-secondary)]">{c.city}</td>
                  <td className="py-3 text-[var(--text-secondary)]">{c.industry || "-"}</td>
                  <td className="py-3 font-mono text-[var(--text-secondary)]">
                    {c.review_count} ulasan
                  </td>
                  <td className="py-3 font-mono text-emerald-600 dark:text-emerald-400">
                    {c.avg_stipend > 0 ? formatRupiah(c.avg_stipend) : "Tidak ada uang saku"}
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      ★ {Number(c.avg_overall).toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
