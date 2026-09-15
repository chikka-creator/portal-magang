"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { formatRupiah, formatRelativeTime } from "@/lib/format";
import AdminAnalyticsTab from "@/components/admin/AdminAnalyticsTab";
import AdminCompaniesTab from "@/components/admin/AdminCompaniesTab";
import AdminQuestionsTab from "@/components/admin/AdminQuestionsTab";
import AdminAuditTab from "@/components/admin/AdminAuditTab";
import AdminBroadcastTab from "@/components/admin/AdminBroadcastTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, flagsRes, claimsRes, reviewsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/flags"),
        fetch("/api/admin/claims"),
        fetch(`/api/admin/reviews?status=${reviewFilter}`),
      ]);

      if (statsRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const [statsJson, flagsJson, claimsJson, reviewsJson] = await Promise.all([
        statsRes.json(),
        flagsRes.json(),
        claimsRes.json(),
        reviewsRes.json(),
      ]);

      setStats(statsJson.stats || null);
      setFlags(flagsJson.flags || []);
      setClaims(claimsJson.claims || []);
      setReviews(reviewsJson.reviews || []);
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reviewFilter]);

  const handleUpdateReviewStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch (err) {
      console.error("Failed to update review status:", err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ulasan ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  const handleResolveFlag = async (id: string, status: string, hideReview: boolean = false) => {
    try {
      const res = await fetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, hide_review: hideReview }),
      });
      if (res.ok) {
        setFlags((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status } : f))
        );
      }
    } catch (err) {
      console.error("Failed to resolve flag:", err);
    }
  };

  const handleUpdateClaim = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setClaims((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status } : c))
        );
      }
    } catch (err) {
      console.error("Failed to update claim:", err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingFlagsCount={stats?.pendingFlags || 0}
        pendingClaimsCount={stats?.pendingClaims || 0}
      />

      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          {/* Header */}
          <div className="pt-12 lg:pt-0 flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {currentTab === "overview" && "Ringkasan Platform"}
                {currentTab === "analytics" && "Analitik & Performa Platform"}
                {currentTab === "reviews" && "Moderasi Ulasan Siswa"}
                {currentTab === "flags" && "Laporan Masalah dari Siswa"}
                {currentTab === "questions" && "Moderasi Tanya Jawab (Q&A)"}
                {currentTab === "claims" && "Verifikasi Klaim Perusahaan"}
                {currentTab === "companies" && "Manajemen Data Perusahaan"}
                {currentTab === "broadcasts" && "Broadcast Pengumuman"}
                {currentTab === "audit" && "Catatan Aktivitas & Audit Trail"}
                {currentTab === "settings" && "Pengaturan & Konfigurasi"}
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Panel pengelolaan reputasi dan pengawasan konten SMK
              </p>
            </div>

            <button
              onClick={loadData}
              className="btn-ghost text-xs py-1.5 px-3 border border-[var(--border-primary)]"
            >
              🔄 Refresh Data
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-28 rounded-xl skeleton" />
              <div className="h-28 rounded-xl skeleton" />
              <div className="h-28 rounded-xl skeleton" />
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {currentTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="glass-card p-4 text-center">
                      <p className="text-[11px] text-[var(--text-muted)]">Total Ulasan</p>
                      <p className="text-xl sm:text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">
                        {stats?.totalReviews || 0}
                      </p>
                    </div>

                    <div className="glass-card p-4 text-center">
                      <p className="text-[11px] text-[var(--text-muted)]">Ulasan Disembunyikan</p>
                      <p className="text-xl sm:text-2xl font-bold font-mono text-amber-500 mt-1">
                        {stats?.hiddenReviews || 0}
                      </p>
                    </div>

                    <div className="glass-card p-4 text-center">
                      <p className="text-[11px] text-[var(--text-muted)]">Laporan Masalah</p>
                      <p className="text-xl sm:text-2xl font-bold font-mono text-rose-500 mt-1">
                        {stats?.pendingFlags || 0}
                      </p>
                    </div>

                    <div className="glass-card p-4 text-center">
                      <p className="text-[11px] text-[var(--text-muted)]">Klaim Pending</p>
                      <p className="text-xl sm:text-2xl font-bold font-mono text-blue-500 mt-1">
                        {stats?.pendingClaims || 0}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Alerts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                          Laporan Belum Ditinjau
                        </h3>
                        <button
                          onClick={() => setCurrentTab("flags")}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Lihat Semua →
                        </button>
                      </div>
                      {flags.filter((f) => f.status === "pending").length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                          Tidak ada laporan yang menunggu peninjauan 🎉
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {flags
                            .filter((f) => f.status === "pending")
                            .slice(0, 3)
                            .map((f) => (
                              <div
                                key={f.id}
                                className="p-2.5 rounded-lg bg-[var(--accent-tint)] text-xs flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-medium text-[var(--text-primary)]">
                                    {f.company_name} — {f.position}
                                  </p>
                                  <p className="text-[11px] text-[var(--text-muted)]">
                                    Alasan: <span className="text-rose-500">{f.reason}</span>
                                  </p>
                                </div>
                                <button
                                  onClick={() => setCurrentTab("flags")}
                                  className="text-[11px] px-2 py-1 rounded bg-card border border-border"
                                >
                                  Tinjau
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="glass-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                          Pengajuan Klaim Perusahaan
                        </h3>
                        <button
                          onClick={() => setCurrentTab("claims")}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Lihat Semua →
                        </button>
                      </div>
                      {claims.filter((c) => c.status === "pending").length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                          Tidak ada pengajuan klaim baru saat ini.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {claims
                            .filter((c) => c.status === "pending")
                            .slice(0, 3)
                            .map((c) => (
                              <div
                                key={c.id}
                                className="p-2.5 rounded-lg bg-[var(--accent-tint)] text-xs flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-medium text-[var(--text-primary)]">
                                    {c.company_name}
                                  </p>
                                  <p className="text-[11px] text-[var(--text-muted)]">
                                    {c.contact_name} ({c.contact_email})
                                  </p>
                                </div>
                                <button
                                  onClick={() => setCurrentTab("claims")}
                                  className="text-[11px] px-2 py-1 rounded bg-card border border-border"
                                >
                                  Verifikasi
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REVIEWS */}
              {currentTab === "reviews" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {["all", "published", "hidden"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setReviewFilter(status)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                          ${
                            reviewFilter === status
                              ? "bg-[var(--accent-tint)] text-[var(--text-primary)] border border-[var(--border-hover)]"
                              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          }
                        `}
                      >
                        {status === "all" ? "Semua Status" : status}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[var(--text-muted)] glass-card">
                        Tidak ada ulasan pada filter ini.
                      </div>
                    ) : (
                      reviews.map((r) => (
                        <div key={r.id} className="glass-card p-4 sm:p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-primary)]">
                                {r.company_name} — {r.position}
                              </h4>
                              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                {formatRupiah(r.stipend_amount)}/bln • Skor Lingkungan: {r.environment_score} • Mentorship: {r.mentorship_score}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                r.status === "hidden"
                                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {r.status || "published"}
                            </span>
                          </div>

                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            {r.review_text}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)] text-xs">
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {formatRelativeTime(r.created_at)} • {r.helpful_count} vote bermanfaat
                            </span>

                            <div className="flex items-center gap-2">
                              {r.status === "hidden" ? (
                                <button
                                  onClick={() => handleUpdateReviewStatus(r.id, "published")}
                                  className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20"
                                >
                                  Tampilkan Kembali
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateReviewStatus(r.id, "hidden")}
                                  className="text-[11px] px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20"
                                >
                                  Sembunyikan
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteReview(r.id)}
                                className="text-[11px] px-2.5 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: FLAGS */}
              {currentTab === "flags" && (
                <div className="space-y-3">
                  {flags.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)] glass-card">
                      Belum ada laporan dari siswa.
                    </div>
                  ) : (
                    flags.map((f) => (
                      <div key={f.id} className="glass-card p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                {f.reason}
                              </span>
                              <span className="text-xs font-semibold text-[var(--text-primary)]">
                                {f.company_name} — {f.position}
                              </span>
                            </div>
                            {f.description && (
                              <p className="text-xs text-[var(--text-muted)] mt-1.5 italic">
                                "{f.description}"
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground">
                            {f.status}
                          </span>
                        </div>

                        <div className="p-3 rounded-lg bg-[var(--accent-tint)] text-xs text-[var(--text-secondary)]">
                          <p className="font-medium text-[11px] text-[var(--text-muted)] mb-1">
                            Isi Ulasan yang Dilaporkan:
                          </p>
                          {f.review_text}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)] text-xs">
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Dilaporkan {formatRelativeTime(f.created_at)}
                          </span>

                          {f.status === "pending" && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResolveFlag(f.id, "dismissed")}
                                className="text-[11px] px-2.5 py-1 rounded border border-border text-muted-foreground hover:bg-accent"
                              >
                                Abaikan Laporan
                              </button>
                              <button
                                onClick={() => handleResolveFlag(f.id, "resolved", true)}
                                className="text-[11px] px-2.5 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 font-medium"
                              >
                                Selesaikan & Sembunyikan Ulasan
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: CLAIMS */}
              {currentTab === "claims" && (
                <div className="space-y-3">
                  {claims.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)] glass-card">
                      Belum ada klaim perusahaan yang diajukan.
                    </div>
                  ) : (
                    claims.map((c) => (
                      <div key={c.id} className="glass-card p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
                              {c.company_name} ({c.city})
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                              Kontak: <strong>{c.contact_name}</strong> • {c.contact_position || "Perwakilan Resmi"}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono">
                              Email: {c.contact_email}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                              c.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : c.status === "rejected"
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)] text-xs">
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Diajukan {formatRelativeTime(c.created_at)}
                          </span>

                          {c.status === "pending" && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateClaim(c.id, "rejected")}
                                className="text-[11px] px-2.5 py-1 rounded border border-border text-rose-500 hover:bg-rose-500/10"
                              >
                                Tolak Klaim
                              </button>
                              <button
                                onClick={() => handleUpdateClaim(c.id, "approved")}
                                className="text-[11px] px-2.5 py-1 rounded bg-emerald-500 text-white hover:opacity-90 font-medium"
                              >
                                Setujui & Verifikasi
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: ANALYTICS */}
              {currentTab === "analytics" && <AdminAnalyticsTab />}

              {/* TAB 6: QUESTIONS */}
              {currentTab === "questions" && <AdminQuestionsTab />}

              {/* TAB 7: COMPANIES */}
              {currentTab === "companies" && <AdminCompaniesTab />}

              {/* TAB 8: BROADCASTS */}
              {currentTab === "broadcasts" && <AdminBroadcastTab />}

              {/* TAB 9: AUDIT */}
              {currentTab === "audit" && <AdminAuditTab />}

              {/* TAB 10: SETTINGS */}
              {currentTab === "settings" && <AdminSettingsTab />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
