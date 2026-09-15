"use client";

import React, { useState } from "react";

interface ClaimModalProps {
  companyId: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClaimModal({
  companyId,
  companyName,
  isOpen,
  onClose,
  onSuccess,
}: ClaimModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/companies/${companyId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: name,
          contact_email: email,
          contact_position: position,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan klaim");
      }

      setSuccessMsg(data.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-6 sm:p-7 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Klaim Halaman Perusahaan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verifikasi kepemilikan profil resmi untuk <strong className="text-foreground">{companyName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-600 dark:text-emerald-400">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Nama Lengkap Perwakilan
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-hidden focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Email Resmi Perusahaan
            </label>
            <input
              type="email"
              required
              placeholder="hrd@perusahaan.co.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-hidden focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Jabatan / Divisi
            </label>
            <input
              type="text"
              placeholder="Contoh: HR Manager / Talent Acquisition"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-hidden focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Password Akses Balasan
            </label>
            <input
              type="password"
              required
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-hidden focus:ring-1 focus:ring-ring text-foreground"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Password ini digunakan untuk memvalidasi identitas saat memberikan tanggapan resmi ke ulasan.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-accent text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
