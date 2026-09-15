"use client";

import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/format";

export default function AdminAuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/audit?action=${actionFilter}&page=${page}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs || []);
        setTotalPages(json.totalPages || 1);
        setTotalLogs(json.total || 0);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, page]);

  const getActionBadge = (action: string) => {
    if (action.includes("create")) {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    if (action.includes("delete") || action.includes("reject")) {
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
    if (action.includes("update") || action.includes("moderate") || action.includes("change")) {
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      moderate_review: "Moderasi Ulasan",
      delete_review: "Hapus Ulasan",
      resolve_flag: "Selesaikan Laporan",
      approve_claim: "Setujui Klaim DUDI",
      reject_claim: "Tolak Klaim DUDI",
      create_company: "Tambah Perusahaan",
      update_company: "Edit Perusahaan",
      delete_company: "Hapus Perusahaan",
      answer_question: "Jawab Pertanyaan",
      delete_question: "Hapus Pertanyaan",
      create_broadcast: "Buat Pengumuman",
      activate_broadcast: "Aktifkan Pengumuman",
      deactivate_broadcast: "Nonaktifkan Pengumuman",
      delete_broadcast: "Hapus Pengumuman",
      update_settings: "Ubah Pengaturan Platform",
      change_password: "Ganti Password Admin",
    };
    return map[action] || action;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            📋 Audit Trail & Activity Log ({totalLogs})
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Catatan transparansi dan akuntabilitas semua tindakan yang dilakukan oleh administrator
          </p>
        </div>

        {/* Filter */}
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="py-1.5 px-3 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
        >
          <option value="all">Semua Tindakan</option>
          <option value="moderate_review">Moderasi Ulasan</option>
          <option value="delete_review">Hapus Ulasan</option>
          <option value="resolve_flag">Penyelesaian Laporan</option>
          <option value="approve_claim">Persetujuan Klaim</option>
          <option value="create_company">Penambahan Perusahaan</option>
          <option value="update_company">Perubahan Perusahaan</option>
          <option value="delete_company">Penghapusan Perusahaan</option>
          <option value="create_broadcast">Pengumuman Broadcast</option>
          <option value="update_settings">Pengaturan Sistem</option>
          <option value="change_password">Pergantian Password</option>
        </select>
      </div>

      {/* Logs Timeline / Table */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-16 rounded-xl skeleton" />
          <div className="h-16 rounded-xl skeleton" />
          <div className="h-16 rounded-xl skeleton" />
          <div className="h-16 rounded-xl skeleton" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 text-center text-xs text-[var(--text-muted)]">
          Belum ada log aktivitas untuk filter yang dipilih.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const hasDetails = log.details && Object.keys(log.details).length > 0;

            return (
              <div
                key={log.id}
                className="glass-card p-4 transition-all duration-150 hover:border-[var(--border-hover)] space-y-2"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      Oleh <strong>@{log.admin_username}</strong>
                    </span>
                    {log.target_type && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent-tint)] text-[var(--text-secondary)] font-mono">
                        Target: {log.target_type}
                        {log.target_id && ` #${log.target_id.slice(0, 8)}`}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>

                {/* Details preview or expandable */}
                {hasDetails && (
                  <div className="pt-1">
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{isExpanded ? "▾ Sembunyikan Detail JSON" : "▸ Lihat Detail Tindakan"}</span>
                    </button>

                    {isExpanded && (
                      <pre className="mt-2 p-3 rounded-lg bg-[var(--bg-input)] text-[11px] font-mono text-[var(--text-secondary)] overflow-x-auto border border-[var(--border-primary)]">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)] text-xs">
              <span className="text-[var(--text-muted)] font-mono">
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border border-[var(--border-primary)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--accent-tint)]"
                >
                  ← Sebelumnya
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded border border-[var(--border-primary)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--accent-tint)]"
                >
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
