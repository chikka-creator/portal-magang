"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login gagal");
      }

      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Periksa username dan password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm glass-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[var(--accent-tint)] border border-[var(--border-primary)] flex items-center justify-center text-lg">
            🛡️
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Admin Portal Magang
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Masuk untuk mengelola moderasi dan verifikasi
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--border-hover)]"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--border-hover)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-xs py-2.5 font-medium flex items-center justify-center gap-2"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              ← Kembali ke Beranda Siswa
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
