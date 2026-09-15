"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/format";

export default function AdminBroadcastTab() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("info");
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const priorityOptions = [
    {
      id: "info",
      label: "Informasi",
      colorLabel: "(Biru)",
      icon: "ℹ️",
      badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    {
      id: "warning",
      label: "Perhatian",
      colorLabel: "(Kuning)",
      icon: "⚠️",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    {
      id: "urgent",
      label: "Penting / Darurat",
      colorLabel: "(Merah)",
      icon: "🚨",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    },
  ];

  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/broadcasts");
      const json = await res.json();
      if (json.success) {
        setBroadcasts(json.broadcasts || []);
      }
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Judul pengumuman wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || null,
          priority,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat pengumuman");

      setBroadcasts((prev) => [json.broadcast, ...prev]);
      setShowAddModal(false);
      setTitle("");
      setBody("");
      setPriority("info");
      setExpiresAt("");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      if (res.ok) {
        setBroadcasts((prev) =>
          prev.map((b) => (b.id === id ? { ...b, is_active: !currentStatus } : b))
        );
      }
    } catch (err) {
      console.error("Failed to toggle broadcast:", err);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;

    try {
      const res = await fetch(`/api/admin/broadcasts?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete broadcast:", err);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            📢 Broadcast & Pengumuman Platform
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Publikasikan pengumuman penting, panduan PKL, atau peringatan sistem yang muncul di bagian atas portal siswa
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
        >
          <span>➕</span>
          <span>Buat Pengumuman</span>
        </button>
      </div>

      {/* Broadcast List */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="glass-card p-12 text-center text-xs text-[var(--text-muted)]">
          Belum ada broadcast pengumuman. Klik tombol di atas untuk membuat pengumuman baru.
        </div>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((b) => {
            const isExpired = b.expires_at && new Date(b.expires_at) < new Date();

            return (
              <div
                key={b.id}
                className={`glass-card p-5 space-y-3 transition-opacity ${
                  !b.is_active || isExpired ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadge(
                          b.priority
                        )}`}
                      >
                        {b.priority}
                      </span>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">
                        {b.title}
                      </h4>
                      {isExpired && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 font-mono">
                          Kadaluarsa
                        </span>
                      )}
                    </div>
                    {b.body && (
                      <p className="text-xs text-[var(--text-secondary)] pt-1 whitespace-pre-wrap">
                        {b.body}
                      </p>
                    )}
                  </div>

                  {/* Toggle Active Button */}
                  <button
                    onClick={() => handleToggleActive(b.id, b.is_active)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors shrink-0 ${
                      b.is_active
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                    }`}
                  >
                    {b.is_active ? "● Aktif Tayang" : "○ Dinonaktifkan"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)] text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    <span>Dibuat {formatRelativeTime(b.created_at)}</span>
                    {b.expires_at && (
                      <span>
                        • Berakhir: {new Date(b.expires_at).toLocaleDateString("id-ID")}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteBroadcast(b.id)}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE BROADCAST MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="glass-card max-w-md w-full p-6 space-y-4 shadow-xl border border-[var(--border-hover)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-primary)]">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                📢 Buat Pengumuman Baru
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Periode Pengisian Laporan Magang Semester Gasal Dibuka"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Isi Pesan / Penjelasan
                </label>
                <textarea
                  rows={3}
                  placeholder="Isi detail pengumuman yang ingin disampaikan kepada siswa..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Tingkat Prioritas
                  </label>
                  <div className="relative">
                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] flex items-center justify-between hover:border-[var(--border-hover)] transition-all focus:outline-hidden"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span>{priorityOptions.find((p) => p.id === priority)?.icon}</span>
                        <span className="font-medium text-[var(--text-primary)] truncate">
                          {priorityOptions.find((p) => p.id === priority)?.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono hidden sm:inline">
                          {priorityOptions.find((p) => p.id === priority)?.colorLabel}
                        </span>
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                          priorityDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {priorityDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setPriorityDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-xl bg-[#141417] border border-[var(--border-hover)] shadow-2xl p-1.5 space-y-1">
                          {priorityOptions.map((opt) => {
                            const isSelected = opt.id === priority;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setPriority(opt.id);
                                  setPriorityDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${
                                  isSelected
                                    ? "bg-[var(--accent-tint)] text-white font-semibold border border-[var(--border-hover)]"
                                    : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-tint)]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{opt.icon}</span>
                                  <span className="font-medium text-white">{opt.label}</span>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${opt.badgeClass}`}
                                >
                                  {opt.colorLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Batas Tayang (Opsional)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-primary)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-tint)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
                >
                  {submitting ? "Membuat..." : "Tayangkan Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
