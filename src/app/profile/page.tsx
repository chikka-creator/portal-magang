"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import StarRating from "@/components/StarRating";
import { formatRupiah, formatRelativeTime } from "@/lib/format";

export default function ProfilePage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    position: "",
    stipend_amount: 0,
    environment_score: 5,
    mentorship_score: 5,
    review_text: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Failed to load profile reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const openEdit = (review: any) => {
    setEditingReview(review);
    setEditForm({
      position: review.position,
      stipend_amount: review.stipend_amount,
      environment_score: review.environment_score,
      mentorship_score: review.mentorship_score,
      review_text: review.review_text,
    });
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch("/api/profile/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingReview.id,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui ulasan");
      }

      setEditingReview(null);
      loadReviews();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ulasan ini?")) return;
    try {
      const res = await fetch(`/api/profile/reviews?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  const totalHelpful = reviews.reduce((sum, r) => sum + (r.helpful_count || 0), 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          {/* Header */}
          <div className="pt-12 lg:pt-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Profil Ulasan Saya
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Kelola riwayat ulasan magang anonim yang pernah Anda bagikan
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-24 rounded-xl skeleton" />
              <div className="h-44 rounded-xl skeleton" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="glass-card p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--accent-tint)] border border-[var(--border-primary)] flex items-center justify-center text-xl">
                ✍️
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Belum Ada Riwayat Ulasan
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                  Anda belum pernah mengirimkan ulasan magang pada peramban ini. Bagikan pengalaman magang Anda untuk membantu sesama siswa SMK!
                </p>
              </div>
              <Link href="/write" className="btn-primary text-xs py-2 px-4 inline-flex">
                + Tulis Ulasan Sekarang
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Personal Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="glass-card p-4 text-center">
                  <p className="text-[11px] text-[var(--text-muted)]">Ulasan Terkirim</p>
                  <p className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                    {reviews.length}
                  </p>
                </div>

                <div className="glass-card p-4 text-center">
                  <p className="text-[11px] text-[var(--text-muted)]">Total Vote Bermanfaat</p>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {totalHelpful}
                  </p>
                </div>

                <div className="glass-card p-4 text-center col-span-2 sm:col-span-1">
                  <p className="text-[11px] text-[var(--text-muted)]">Status Identitas</p>
                  <p className="text-xs font-medium text-[var(--text-primary)] mt-2 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Terenkripsi SHA-256
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Daftar Ulasan Anda
                </h2>

                {reviews.map((r) => (
                  <div key={r.id} className="glass-card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/companies/${r.company_id}`}
                          className="text-xs font-semibold text-[var(--text-primary)] hover:underline"
                        >
                          {r.company_name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[var(--text-secondary)]">
                            {r.position}
                          </span>
                          <span className="badge-neutral text-[11px] py-0.5 px-1.5">
                            {formatRupiah(r.stipend_amount)}/bln
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(r)}
                          className="px-2.5 py-1 rounded text-xs border border-border hover:bg-accent text-foreground transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="px-2.5 py-1 rounded text-xs border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-[var(--border-primary)] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-muted)]">Lingkungan</span>
                        <StarRating value={r.environment_score} readonly size="sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-muted)]">Mentorship</span>
                        <StarRating value={r.mentorship_score} readonly size="sm" />
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {r.review_text}
                    </p>

                    {r.company_reply_text && (
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-l-2 border-emerald-500 rounded-r-lg text-xs space-y-1">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                          Tanggapan Resmi Perusahaan:
                        </p>
                        <p className="text-foreground">{r.company_reply_text}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[var(--border-primary)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Dikirim {formatRelativeTime(r.created_at)}</span>
                      <span>👍 {r.helpful_count} orang terbantu</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit Review Modal */}
          {editingReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Edit Ulasan: {editingReview.company_name}
                  </h3>
                  <button
                    onClick={() => setEditingReview(null)}
                    className="text-muted-foreground hover:text-foreground text-xs p-1"
                  >
                    ✕
                  </button>
                </div>

                {editError && (
                  <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                    {editError}
                  </div>
                )}

                <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-muted-foreground mb-1">Jurusan / Posisi</label>
                    <input
                      type="text"
                      required
                      value={editForm.position}
                      onChange={(e) =>
                        setEditForm({ ...editForm, position: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">
                      Uang Saku per Bulan (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={50000}
                      value={editForm.stipend_amount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          stipend_amount: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        Skor Lingkungan Kerja
                      </label>
                      <StarRating
                        value={editForm.environment_score}
                        onChange={(val) =>
                          setEditForm({ ...editForm, environment_score: val })
                        }
                        size="md"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        Skor Bimbingan Mentor
                      </label>
                      <StarRating
                        value={editForm.mentorship_score}
                        onChange={(val) =>
                          setEditForm({ ...editForm, mentorship_score: val })
                        }
                        size="md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground mb-1">Isi Ulasan</label>
                    <textarea
                      rows={4}
                      required
                      value={editForm.review_text}
                      onChange={(e) =>
                        setEditForm({ ...editForm, review_text: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingReview(null)}
                      className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-accent"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="btn-primary text-xs py-1.5 px-4"
                    >
                      {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
