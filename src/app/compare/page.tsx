"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useCompare, clearCompareList } from "@/lib/compare";

export default function ComparePage() {
  const { compareList, toggleCompare } = useCompare();
  const [companyDetails, setCompanyDetails] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/companies");
        if (res.ok) {
          const data = await res.json();
          const list = data.companies || [];
          setAllCompanies(list);

          if (compareList.length > 0) {
            // Fetch detailed stats for selected companies
            const detailPromises = compareList.map((id) =>
              fetch(`/api/companies/${id}`).then((r) => r.json())
            );
            const details = await Promise.all(detailPromises);
            setCompanyDetails(
              details
                .filter((d) => d.success && d.data)
                .map((d) => {
                  const c = d.data;
                  return {
                    id: c.id,
                    name: c.name,
                    city: c.city,
                    industry: c.industry,
                    claim: c.is_claimed
                      ? { status: "approved", contact_name: c.claim_info?.contact_name, contact_position: c.claim_info?.contact_position }
                      : null,
                    stats: {
                      avgOverall: c.review_count > 0 ? ((Number(c.avg_environment) + Number(c.avg_mentorship)) / 2).toFixed(1) : "0",
                      avgStipend: Number(c.avg_stipend) || 0,
                      avgEnvironment: Number(c.avg_environment) || 0,
                      avgMentorship: Number(c.avg_mentorship) || 0,
                      totalReviews: Number(c.review_count) || 0,
                    },
                  };
                })
            );
          } else {
            setCompanyDetails([]);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [compareList]);

  return (
    <div className="flex h-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-primary)] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Fitur Komparasi
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {compareList.length}/3 Terpilih
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Perbandingan Perusahaan Magang
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Bandingkan skor lingkungan, bimbingan mentor, dan rata-rata kompensasi uang saku secara berdampingan.
            </p>
          </div>

          {compareList.length > 0 && (
            <button
              onClick={() => clearCompareList()}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-[var(--border-primary)] text-xs text-[var(--text-secondary)] hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all"
            >
              Hapus Semua Perbandingan
            </button>
          )}
        </div>

        {/* State Empty / Selection */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[var(--text-muted)]">
            Memuat data komparasi...
          </div>
        ) : companyDetails.length === 0 ? (
          <div className="py-16 px-6 text-center rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--bg-card)] max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-tint)] flex items-center justify-center mx-auto text-2xl">
              ⚖️
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Belum Ada Perusahaan Ditambahkan
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Pilih hingga 3 tempat magang dari halaman daftar perusahaan atau tambahkan di bawah untuk membandingkan matriksnya.
            </p>

            <div className="pt-2 flex justify-center gap-2 flex-wrap">
              {allCompanies.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleCompare(c.id)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] text-xs text-[var(--text-primary)] transition-all"
                >
                  + {c.name}
                </button>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href="/companies"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-xs hover:opacity-90 transition-opacity"
              >
                Jelajahi Semua Perusahaan →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Quick selector bar if less than 3 */}
            {companyDetails.length < 3 && (
              <div className="p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 flex items-center justify-between gap-3 text-xs">
                <span className="text-[var(--text-muted)]">
                  💡 Kamu bisa memilih 1 lagi untuk membandingkan 3 tempat magang sekaligus.
                </span>
                <div className="flex gap-1.5 overflow-x-auto">
                  {allCompanies
                    .filter((c) => !compareList.includes(c.id))
                    .slice(0, 3)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => toggleCompare(c.id)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-hover)] text-[11px] font-medium text-[var(--text-primary)] whitespace-nowrap"
                      >
                        + {c.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Side-by-side Table Comparison */}
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/80">
                    <th className="p-4 w-48 text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                      Kriteria Matriks
                    </th>
                    {companyDetails.map((c) => (
                      <th key={c.id} className="p-4 min-w-[220px] align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--accent-tint)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
                              {c.industry || "Industri General"}
                            </span>
                            <h3 className="font-bold text-sm text-[var(--text-primary)] mt-1">
                              {c.name}
                            </h3>
                            <p className="text-[11px] text-[var(--text-muted)]">{c.city}</p>
                          </div>
                          <button
                            onClick={() => toggleCompare(c.id)}
                            className="p-1 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                            title="Hapus"
                          >
                            ✕
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {/* Status Verifikasi */}
                  <tr>
                    <td className="p-4 font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/30">
                      Status Perusahaan
                    </td>
                    {companyDetails.map((c) => (
                      <td key={c.id} className="p-4">
                        {c.claim && c.claim.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ Terverifikasi Resmi
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Profil Publik Siswa
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Rating Keseluruhan */}
                  <tr>
                    <td className="p-4 font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/30">
                      Rating Rata-rata
                    </td>
                    {companyDetails.map((c) => (
                      <td key={c.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-[var(--text-primary)]">
                            ★ {c.stats?.avgOverall ?? '–'}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">/ 5.0</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Uang Saku Bulanan */}
                  <tr>
                    <td className="p-4 font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/30">
                      Rata-rata Uang Saku
                    </td>
                    {companyDetails.map((c) => (
                      <td key={c.id} className="p-4 font-bold text-emerald-400 font-mono text-sm">
                        {(c.stats?.avgStipend ?? 0) > 0
                          ? `Rp ${(c.stats?.avgStipend ?? 0).toLocaleString("id-ID")}`
                          : "Tidak ada data saku"}
                        <span className="block font-normal text-[10px] text-[var(--text-muted)] font-sans mt-0.5">
                          / bulan
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Skor Lingkungan Kerja */}
                  <tr>
                    <td className="p-4 font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/30">
                      Skor Lingkungan Kerja
                    </td>
                    {companyDetails.map((c) => (
                      <td key={c.id} className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{c.stats?.avgEnvironment ?? 0} / 5</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(Number(c.stats?.avgEnvironment ?? 0) / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Skor Bimbingan Mentor */}
                  <tr>
                    <td className="p-4 font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/30">
                      Skor Mentorship
                    </td>
                    {companyDetails.map((c) => (
                      <td key={c.id} className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{c.stats?.avgMentorship ?? 0} / 5</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${(Number(c.stats?.avgMentorship ?? 0) / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Jumlah Ulasan Masuk */}
                  <tr>
                    <td className="p-4 font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/30">
                      Sampel Ulasan Siswa
                    </td>
                    {companyDetails.map((c) => (
                      <td key={c.id} className="p-4 text-[var(--text-secondary)]">
                        {c.stats?.totalReviews ?? 0} ulasan SMK terverifikasi
                      </td>
                    ))}
                  </tr>

                  {/* Detail Action */}
                  <tr>
                    <td className="p-4 bg-[var(--bg-secondary)]/30" />
                    {companyDetails.map((c) => (
                      <td key={c.id} className="p-4">
                        <Link
                          href={`/companies/${c.id}`}
                          className="inline-flex items-center justify-center w-full py-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--accent-tint)] text-xs font-semibold text-[var(--text-primary)] transition-all"
                        >
                          Lihat Detail Perusahaan →
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
