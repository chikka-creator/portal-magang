"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/format";

export default function CompanyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const [compRes, revRes] = await Promise.all([
          fetch(`/api/companies/${id}`),
          fetch(`/api/reviews?company_id=${id}`),
        ]);

        if (compRes.ok) {
          const compJson = await compRes.json();
          if (compJson.success && compJson.data) {
            const d = compJson.data;
            setCompany(d);
            setStats({
              avgOverall: d.review_count > 0 ? ((Number(d.avg_environment) + Number(d.avg_mentorship)) / 2).toFixed(1) : "0",
              avgStipend: Number(d.avg_stipend) || 0,
              avgEnvironment: Number(d.avg_environment) || 0,
              avgMentorship: Number(d.avg_mentorship) || 0,
              totalReviews: Number(d.review_count) || 0,
            });
            setClaim(
              d.is_claimed
                ? { status: "approved", contact_name: d.claim_info?.contact_name }
                : null
            );
          }
        }

        if (revRes.ok) {
          const revJson = await revRes.json();
          if (revJson.success) {
            setReviews(revJson.data || []);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs">
        Menyiapkan dokumen Laporan Transparansi Magang...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950 text-zinc-400 text-xs">
        Perusahaan tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-900 text-zinc-900 font-sans p-4 sm:p-8">
      {/* Top Action Bar (hidden when printed) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/companies/${id}`}
          className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
        >
          ← Kembali ke Detail Perusahaan
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors shadow-lg flex items-center gap-2"
        >
          <span>🖨️ Cetak / Simpan sebagai PDF</span>
        </button>
      </div>

      {/* Printable Paper A4 Container */}
      <div
        className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-2xl space-y-8 border border-zinc-200 print:shadow-none print:p-0 print:border-none print:rounded-none"
        style={{ color: "#111827" }}
      >
        {/* Header Document */}
        <div className="border-b-2 border-zinc-900 pb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded bg-zinc-900 text-white font-bold text-xs flex items-center justify-center">
                PM
              </span>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight text-zinc-900 uppercase">
                  Portal Magang SMK Surabaya
                </h1>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Sistem Transparansi Reputasi & Kompensasi Prakerin
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-300 font-mono text-[10.5px] font-bold text-zinc-700">
              DOKUMEN RESMI BKN / BK
            </span>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">
              Tanggal Cetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-2 bg-zinc-50 rounded-lg border border-zinc-200">
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-800">
            LAPORAN REKAPITULASI EVALUASI TEMPAT MAGANG
          </h2>
          <p className="text-xs text-zinc-600">
            Rekomendasi Transparansi Lingkungan Kerja & Uang Saku Bagi Siswa SMK
          </p>
        </div>

        {/* Company Profile Summary */}
        <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">NAMA PERUSAHAAN MITRA</span>
              <span className="font-bold text-sm text-zinc-900">{company.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">SEKTOR / INDUSTRI</span>
              <span className="font-medium text-zinc-700">{company.industry || "Umum"}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">KOTA / LOKASI</span>
              <span className="font-medium text-zinc-700">{company.city}</span>
            </div>
          </div>

          <div className="space-y-2 text-right">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">STATUS KLIM PERUSAHAAN</span>
              {claim && claim.status === "approved" ? (
                <span className="inline-block px-2 py-0.5 rounded font-bold text-[10.5px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✓ TERVERIFIKASI RESMI HRD
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded font-medium text-[10.5px] bg-zinc-200 text-zinc-700">
                  Profil Publik Siswa
                </span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">TOTAL RESPONDEN ULASAN</span>
              <span className="font-bold text-zinc-900">{stats.totalReviews} Siswa SMK</span>
            </div>
          </div>
        </div>

        {/* Rating Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-1">
            I. METRIKS EVALUASI RATA-RATA (SKALA 1 - 5)
          </h3>

          <table className="w-full text-xs border-collapse border border-zinc-300">
            <thead>
              <tr className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-700">
                <th className="p-2.5 text-left border-r border-zinc-300">Indikator Penilaian</th>
                <th className="p-2.5 text-center border-r border-zinc-300">Skor Rata-Rata</th>
                <th className="p-2.5 text-left">Kategori Evaluasi BK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="p-2.5 font-medium border-r border-zinc-300">Rata-Rata Kompensasi Uang Saku</td>
                <td className="p-2.5 text-center font-bold font-mono text-emerald-700 border-r border-zinc-300">
                  {formatRupiah(stats.avgStipend)} / bln
                </td>
                <td className="p-2.5 font-medium">
                  {stats.avgStipend >= 500000 ? "Standar Di Atas Rata-rata SMK" : "Kompensasi Standar/Pengalaman"}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium border-r border-zinc-300">Skor Lingkungan Kerja Siswa</td>
                <td className="p-2.5 text-center font-bold border-r border-zinc-300">{stats.avgEnvironment} / 5.0</td>
                <td className="p-2.5 font-medium">
                  {Number(stats.avgEnvironment) >= 4.0 ? "Sangat Kondusif & Amankan Siswa" : "Cukup Kondusif"}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium border-r border-zinc-300">Skor Kualitas Bimbingan Mentor</td>
                <td className="p-2.5 text-center font-bold border-r border-zinc-300">{stats.avgMentorship} / 5.0</td>
                <td className="p-2.5 font-medium">
                  {Number(stats.avgMentorship) >= 4.0 ? "Bimbingan Mentor Bintang Lima" : "Bimbingan Mentor Cukup"}
                </td>
              </tr>
              <tr className="bg-zinc-50 font-bold">
                <td className="p-2.5 border-r border-zinc-300">RATING REKOMENDASI KESELURUHAN</td>
                <td className="p-2.5 text-center border-r border-zinc-300 text-sm">★ {stats.avgOverall}</td>
                <td className="p-2.5 text-emerald-800">
                  {Number(stats.avgOverall) >= 4.0 ? "SANGAT DIREKOMENDASIKAN UNTUK PRAKERIN" : "LAYAK DIPERTIMBANGKAN"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Selected Testimonials */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 border-b border-zinc-200 pb-1">
            II. RANGKUMAN ULASAN SISWA MAGANG
          </h3>

          <div className="space-y-3">
            {reviews.slice(0, 3).map((r: any, idx: number) => (
              <div key={r.id} className="p-3 rounded border border-zinc-200 bg-zinc-50/50 space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-bold text-zinc-800">
                  <span>
                    #{idx + 1} Jurusan: {r.position}
                  </span>
                  <span className="font-mono text-zinc-500">{formatDate(r.created_at)}</span>
                </div>
                <p className="text-zinc-700 italic">"{r.review_text}"</p>
                <div className="text-[10px] font-mono text-zinc-500 flex gap-3 pt-1">
                  <span>Uang Saku: {formatRupiah(r.stipend_amount)}</span>
                  <span>Skor Lingkungan: {r.environment_score}/5</span>
                  <span>Skor Mentorship: {r.mentorship_score}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Signatures Block */}
        <div className="pt-8 border-t-2 border-zinc-900 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="font-medium text-zinc-600 mb-12">
              Guru Koordinator BKN / BK SMK
            </p>
            <p className="font-bold border-b border-zinc-400 inline-block px-8 pb-1">
              ( .................................................... )
            </p>
            <p className="text-[10px] text-zinc-400 font-mono mt-1">NIP. ........................................</p>
          </div>

          <div>
            <p className="font-medium text-zinc-600 mb-12">
              Waka Hubungan Industri (Hubin) SMK
            </p>
            <p className="font-bold border-b border-zinc-400 inline-block px-8 pb-1">
              ( .................................................... )
            </p>
            <p className="text-[10px] text-zinc-400 font-mono mt-1">NIP. ........................................</p>
          </div>
        </div>

        {/* Footer Hash Stamp */}
        <div className="text-center pt-4 text-[10px] text-zinc-400 font-mono border-t border-zinc-200">
          Enkripsi Verifikasi Integritas SHA-256: {company.id.substring(0, 16)}... | Portal Magang SMK Surabaya
        </div>
      </div>
    </div>
  );
}
