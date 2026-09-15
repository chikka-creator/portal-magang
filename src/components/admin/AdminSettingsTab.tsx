"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsTab() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.success) {
        const dict: Record<string, any> = {};
        json.settings.forEach((s: any) => {
          dict[s.key] = s.value;
        });
        setSettings(dict);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const handleToggle = async (key: string) => {
    const currentVal = settings[key];
    const newVal = currentVal === "true" ? "false" : "true";

    // Optimistic UI update
    setSettings((prev) => ({
      ...prev,
      [key]: newVal,
    }));

    try {
      setTogglingKey(key);
      setSettingsError("");

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { [key]: newVal } }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah status");

      const labelMap: Record<string, string> = {
        maintenance_mode: "Mode Pemeliharaan (Maintenance Mode)",
        allow_student_reviews: "Izin Pengiriman Ulasan Siswa",
        auto_approve_reviews: "Auto-Publish Ulasan",
      };

      const name = labelMap[key] || key;
      const statusText = newVal === "true" ? "DIAKTIFKAN" : "DINONAKTIFKAN";
      setSettingsSuccess(`✅ ${name} berhasil ${statusText}!`);
      setTimeout(() => setSettingsSuccess(""), 4000);
    } catch (err: any) {
      // Revert state on error
      setSettings((prev) => ({ ...prev, [key]: currentVal }));
      setSettingsError(err.message || "Gagal menyimpan perubahan");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleInputChange = (key: string, val: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccess("");
      setSettingsError("");

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan pengaturan");

      setSettingsSuccess("Pengaturan platform berhasil diperbarui!");
      setTimeout(() => setSettingsSuccess(""), 4000);
    } catch (err: any) {
      setSettingsError(err.message || "Terjadi kesalahan saat menyimpan pengaturan");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password baru tidak cocok.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter.");
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordSuccess("");
      setPasswordError("");

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah password");

      setPasswordSuccess("Password admin berhasil diperbarui! Silakan gunakan password baru saat login berikutnya.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 5000);
    } catch (err: any) {
      setPasswordError(err.message || "Terjadi kesalahan saat mengubah password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-xl skeleton" />
        <div className="h-64 rounded-xl skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          ⚙️ Pengaturan & Konfigurasi Platform
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Atur parameter moderasi otomatis, status operasional portal, dan keamanan akun administrator
        </p>
      </div>

      {/* SYSTEM PARAMETERS FORM */}
      <div className="glass-card p-5 space-y-5">
        <h4 className="text-xs font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border-primary)]">
          🛠️ Parameter Operasional & Moderasi
        </h4>

        {settingsSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            ✅ {settingsSuccess}
          </div>
        )}

        {settingsError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
            ❌ {settingsError}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          {/* Maintenance mode toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--border-primary)] transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Mode Pemeliharaan (Maintenance Mode)
                </span>
                {settings.maintenance_mode === "true" ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
                    ● AKTIF (Pengguna Umum Diblokir)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ○ NONAKTIF (Portal Terbuka Normal)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Bila aktif, portal akan menampilkan halaman perbaikan sistem bagi pengguna umum. Administrator tetap dapat login.
              </p>
            </div>
            <button
              type="button"
              disabled={togglingKey === "maintenance_mode"}
              onClick={() => handleToggle("maintenance_mode")}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer disabled:opacity-50 ${
                settings.maintenance_mode === "true" ? "bg-rose-500" : "bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.maintenance_mode === "true" ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Allow reviews toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--border-primary)] transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Izinkan Pengiriman Ulasan Baru
                </span>
                {settings.allow_student_reviews !== "false" ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ● Dibuka
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    ○ Ditutup Sementara
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Bolehkan siswa SMK mengirim ulasan pengalaman magang baru.
              </p>
            </div>
            <button
              type="button"
              disabled={togglingKey === "allow_student_reviews"}
              onClick={() => handleToggle("allow_student_reviews")}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer disabled:opacity-50 ${
                settings.allow_student_reviews !== "false" ? "bg-emerald-500" : "bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.allow_student_reviews !== "false" ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Auto approve toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--accent-tint)] border border-[var(--border-primary)] transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Auto-Publish Ulasan (Tanpa Moderasi Manual)
                </span>
                {settings.auto_approve_reviews === "true" ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    ● Langsung Tayang
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                    ○ Menunggu Moderasi
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Ulasan yang baru dikirim akan langsung tampil di portal tanpa menunggu persetujuan admin.
              </p>
            </div>
            <button
              type="button"
              disabled={togglingKey === "auto_approve_reviews"}
              onClick={() => handleToggle("auto_approve_reviews")}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer disabled:opacity-50 ${
                settings.auto_approve_reviews === "true" ? "bg-indigo-500" : "bg-zinc-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.auto_approve_reviews === "true" ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Threshold inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Minimal Karakter Ulasan
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={settings.min_review_length || "30"}
                onChange={(e) => handleInputChange("min_review_length", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Mencegah pengiriman ulasan terlalu singkat/spam.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Ambang Auto-Hide Laporan Siswa
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.max_flags_auto_hide || "3"}
                onChange={(e) => handleInputChange("max_flags_auto_hide", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                Ulasan otomatis disembunyikan jika mencapai N laporan pending.
              </span>
            </div>
          </div>

          {/* Contact email */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Email Kontak Dukungan Pengguna
            </label>
            <input
              type="email"
              value={settings.platform_contact_email || "support@portalmagang.id"}
              onChange={(e) => handleInputChange("platform_contact_email", e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary text-xs py-2 px-5 disabled:opacity-50"
            >
              {savingSettings ? "Menyimpan..." : "💾 Simpan Konfigurasi"}
            </button>
          </div>
        </form>
      </div>

      {/* SECURITY / PASSWORD CHANGE FORM */}
      <div className="glass-card p-5 space-y-4">
        <h4 className="text-xs font-bold text-[var(--text-primary)] pb-2 border-b border-[var(--border-primary)]">
          🔒 Keamanan Akun — Ganti Password Administrator
        </h4>

        {passwordSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            ✅ {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
            ❌ {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Password Saat Ini *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Password Baru * (Min 6 Karakter)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Konfirmasi Password Baru *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-sm"
            >
              {savingPassword ? "Memperbarui..." : "🔑 Perbarui Password Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
