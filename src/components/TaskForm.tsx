"use client";

import { useState, useEffect } from "react";
import type { Company } from "@/lib/types";

interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaskForm({ onSuccess, onCancel }: TaskFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    company_id: "",
    description: "",
    due_date: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies");
        const json = await res.json();
        if (json.success) {
          setCompanies(json.data);
          if (json.data.length > 0) {
            setFormData((prev) => ({ ...prev, company_id: json.data[0].id }));
          }
        }
      } catch {
        console.error("Failed to load companies");
      } finally {
        setLoadingCompanies(false);
      }
    }
    loadCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.title.trim().length < 3) {
      setErrorMessage("Judul tugas minimal 3 karakter.");
      return;
    }

    if (!formData.company_id) {
      setErrorMessage("Silakan pilih perusahaan.");
      return;
    }

    setSubmitting(true);

    try {
      // Get student_hash from localStorage or use demo hash
      const studentHash = localStorage.getItem("student_hash") || "hash_demo_student";

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_hash: studentHash,
          title: formData.title.trim(),
          company_id: formData.company_id,
          description: formData.description.trim() || null,
          due_date: formData.due_date || null,
        }),
      });

      const json = await res.json();

      if (json.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(json.error || "Terjadi kesalahan saat membuat task.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 rounded-lg bg-[var(--accent-terracotta-bg)] border border-[var(--accent-terracotta)]/30 text-xs text-[var(--accent-terracotta)]">
          {errorMessage}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Judul Tugas <span className="text-zinc-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Riset PT. Telkom, Baca ulasan, dll."
          maxLength={200}
          className="w-full px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all"
          required
        />
      </div>

      {/* Company selection */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Perusahaan <span className="text-zinc-500">*</span>
        </label>
        {loadingCompanies ? (
          <div className="h-9 rounded-md skeleton w-full" />
        ) : (
          <select
            value={formData.company_id}
            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
            className="w-full px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] transition-all cursor-pointer"
            required
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                {c.name} — {c.city} ({c.industry || "Industri"})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Deskripsi (opsional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detail tugas ini..."
          rows={3}
          maxLength={1000}
          className="w-full px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all resize-none"
        />
      </div>

      {/* Due date */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Tenggat Waktu (opsional)
        </label>
        <input
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          className="w-full px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] transition-all"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-md bg-[var(--accent-primary)] text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Membuat..." : "Buat Task"}
        </button>
      </div>
    </form>
  );
}
