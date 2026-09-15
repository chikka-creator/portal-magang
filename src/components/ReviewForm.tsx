"use client";

import { useState, useEffect } from "react";
import StarRating from "./StarRating";
import type { Company } from "@/lib/types";

interface ReviewFormProps {
  initialCompanyId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const POPULAR_POSITIONS = [
  "Teknik Komputer Jaringan",
  "Rekayasa Perangkat Lunak",
  "Multimedia",
  "Administrasi Perkantoran",
  "Akuntansi",
  "Teknik Mesin",
  "Teknik Otomotif",
  "Teknik Elektronika Industri",
  "Desain Komunikasi Visual",
  "Tata Boga",
];

export default function ReviewForm({
  initialCompanyId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [formData, setFormData] = useState({
    nisn: "",
    company_id: initialCompanyId || "",
    position: "",
    stipend_amount: "500000",
    environment_score: 5,
    mentorship_score: 5,
    review_text: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies");
        const json = await res.json();
        if (json.success) {
          setCompanies(json.data);
          if (!initialCompanyId && json.data.length > 0) {
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
  }, [initialCompanyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!/^\d{10}$/.test(formData.nisn.trim())) {
      setErrorMessage("NISN harus berupa 10 digit angka.");
      return;
    }
    if (!formData.company_id) {
      setErrorMessage("Silakan pilih perusahaan.");
      return;
    }
    if (!formData.position.trim()) {
      setErrorMessage("Silakan isi jurusan/posisi magang.");
      return;
    }
    if (formData.review_text.trim().length < 20) {
      setErrorMessage("Ulasan minimal 20 karakter.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nisn: formData.nisn.trim(),
          company_id: formData.company_id,
          position: formData.position.trim(),
          stipend_amount: Number(formData.stipend_amount) || 0,
          environment_score: Number(formData.environment_score),
          mentorship_score: Number(formData.mentorship_score),
          review_text: formData.review_text.trim(),
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setSuccessMessage("Ulasan kamu berhasil dikirim secara anonim.");
        setFormData({
          nisn: "",
          company_id: initialCompanyId || (companies[0]?.id ?? ""),
          position: "",
          stipend_amount: "500000",
          environment_score: 5,
          mentorship_score: 5,
          review_text: "",
        });
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      } else {
        setErrorMessage(
          json.error || json.errors?.[0]?.message || "Gagal mengirim ulasan."
        );
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Minimalist Security notice box */}
      <div className="p-3 rounded-lg bg-[var(--accent-tint)] border border-[var(--border-primary)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
        <svg className="w-4 h-4 flex-shrink-0 text-[var(--text-primary)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div className="leading-relaxed">
          <span className="text-[var(--text-primary)] font-medium">Jaminan Privasi:</span> Identitas dienkripsi menggunakan algoritma SHA-256 + Secret Salt. NISN mentah langsung dibuang dan tidak pernah disimpan dalam database.
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-100">
          ✓ {successMessage}
        </div>
      )}

      {/* NISN field */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          NISN (Nomor Induk Siswa Nasional) <span className="text-zinc-500">*</span>
        </label>
        <input
          type="text"
          maxLength={10}
          value={formData.nisn}
          onChange={(e) => setFormData({ ...formData, nisn: e.target.value.replace(/\D/g, "") })}
          placeholder="0051234567 (10 digit)"
          className="w-full px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all font-mono"
          required
        />
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          Hanya untuk memvalidasi status siswa dan mencegah ulasan ganda.
        </p>
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
              <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-200">
                {c.name} — {c.city} ({c.industry || "Industri"})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Position & Stipend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Jurusan / Posisi <span className="text-zinc-500">*</span>
          </label>
          <input
            type="text"
            list="positions-list"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Teknik Komputer Jaringan"
            className="w-full px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all"
            required
          />
          <datalist id="positions-list">
            {POPULAR_POSITIONS.map((pos) => (
              <option key={pos} value={pos} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Uang Saku Bulanan (Rp) <span className="text-zinc-500">*</span>
          </label>
          <input
            type="number"
            step="50000"
            min="0"
            max="10000000"
            value={formData.stipend_amount}
            onChange={(e) => setFormData({ ...formData, stipend_amount: e.target.value })}
            placeholder="0 jika tidak ada"
            className="w-full px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all font-mono"
            required
          />
        </div>
      </div>

      {/* Star Ratings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)]">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
            Skor Lingkungan Kerja
          </label>
          <StarRating
            value={formData.environment_score}
            onChange={(val) => setFormData({ ...formData, environment_score: val })}
            size="md"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
            Skor Mentorship
          </label>
          <StarRating
            value={formData.mentorship_score}
            onChange={(val) => setFormData({ ...formData, mentorship_score: val })}
            size="md"
          />
        </div>
      </div>

      {/* Review Text */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Ulasan Pengalaman <span className="text-zinc-500">*</span>
        </label>
        <textarea
          rows={4}
          value={formData.review_text}
          onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
          placeholder="Ceritakan pengalaman magangmu secara objektif (lingkungan kerja, bimbingan mentor, tugas harian)..."
          className="w-full px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all resize-none"
          required
        />
        <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1">
          <span>Min. 20 karakter</span>
          <span className="font-mono">{formData.review_text.length}/5000</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="btn-ghost text-xs py-2 px-3.5"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary text-xs py-2 px-4"
        >
          {submitting ? "Mengirim..." : "Kirim Ulasan Anonim"}
        </button>
      </div>
    </form>
  );
}
