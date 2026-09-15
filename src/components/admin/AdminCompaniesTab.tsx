"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";

export default function AdminCompaniesTab() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [deletingCompany, setDeletingCompany] = useState<any>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Surabaya");
  const [formIndustry, setFormIndustry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/companies");
      const json = await res.json();
      if (json.success) {
        setCompanies(json.companies || []);
      }
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const openAddModal = () => {
    setFormName("");
    setFormCity("Surabaya");
    setFormIndustry("");
    setFormError("");
    setShowAddModal(true);
  };

  const openEditModal = (comp: any) => {
    setEditingCompany(comp);
    setFormName(comp.name);
    setFormCity(comp.city);
    setFormIndustry(comp.industry || "");
    setFormError("");
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Nama perusahaan wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      if (editingCompany) {
        // UPDATE
        const res = await fetch("/api/admin/companies", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCompany.id,
            name: formName.trim(),
            city: formCity.trim(),
            industry: formIndustry.trim() || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal memperbarui");

        setCompanies((prev) =>
          prev.map((c) => (c.id === editingCompany.id ? { ...c, ...json.company } : c))
        );
        setEditingCompany(null);
      } else {
        // CREATE
        const res = await fetch("/api/admin/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            city: formCity.trim(),
            industry: formIndustry.trim() || null,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal menambahkan");

        setCompanies((prev) => [json.company, ...prev]);
        setShowAddModal(false);
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deletingCompany) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/companies?id=${deletingCompany.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCompanies((prev) => prev.filter((c) => c.id !== deletingCompany.id));
        setDeletingCompany(null);
      }
    } catch (err) {
      console.error("Failed to delete company:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry && c.industry.toLowerCase().includes(search.toLowerCase())) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchesCity = cityFilter === "all" || c.city.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const cities = Array.from(new Set(companies.map((c) => c.city))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            🏢 Manajemen Database Perusahaan ({companies.length})
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Kelola data mitra DUDI, tambah entitas baru, atau perbarui profil perusahaan
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
        >
          <span>➕</span>
          <span>Tambah Perusahaan</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Cari nama perusahaan, industri, atau kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
          />
          <span className="absolute left-3 top-2.5 text-xs text-[var(--text-muted)]">🔍</span>
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="py-2 px-3 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden"
        >
          <option value="all">Semua Kota ({companies.length})</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Companies Table */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-12 rounded-lg skeleton" />
          <div className="h-12 rounded-lg skeleton" />
          <div className="h-12 rounded-lg skeleton" />
          <div className="h-12 rounded-lg skeleton" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="glass-card p-12 text-center text-xs text-[var(--text-muted)]">
          Tidak ditemukan perusahaan yang sesuai dengan pencarian "{search}".
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--accent-tint)] text-[var(--text-muted)] font-medium">
                  <th className="py-3 px-4">Nama Perusahaan</th>
                  <th className="py-3 px-4">Kota</th>
                  <th className="py-3 px-4">Industri / Sektor</th>
                  <th className="py-3 px-4">Jumlah Ulasan</th>
                  <th className="py-3 px-4">Rata-rata Uang Saku</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {filteredCompanies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-[var(--accent-tint)] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <span>{comp.name}</span>
                        <Link
                          href={`/companies/${comp.id}`}
                          target="_blank"
                          title="Lihat halaman publik"
                          className="opacity-50 hover:opacity-100 text-[10px] text-indigo-500"
                        >
                          ↗️
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">{comp.city}</td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">
                      <span className="px-2 py-0.5 rounded bg-[var(--accent-tint)] text-[11px]">
                        {comp.industry || "Umum"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                      {comp.review_count || 0} ulasan
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                      {comp.avg_stipend > 0 ? formatRupiah(comp.avg_stipend) : "Tidak ada uang saku"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(comp)}
                          className="px-2.5 py-1 rounded text-[11px] font-medium border border-[var(--border-primary)] hover:bg-[var(--accent-tint)] text-[var(--text-primary)] transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeletingCompany(comp)}
                          className="px-2.5 py-1 rounded text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(showAddModal || editingCompany) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="glass-card max-w-md w-full p-6 space-y-4 shadow-xl border border-[var(--border-hover)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-primary)]">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                {editingCompany ? "✏️ Edit Perusahaan" : "➕ Tambah Perusahaan Baru"}
              </h4>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCompany(null);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Telkom Akses Surabaya"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Kota / Wilayah *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Surabaya, Sidoarjo, Malang"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Bidang / Industri
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Teknologi Informasi, Manufaktur, Perhotelan"
                  value={formIndustry}
                  onChange={(e) => setFormIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-primary)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCompany(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-tint)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : editingCompany ? "Simpan Perubahan" : "Tambah Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="glass-card max-w-sm w-full p-6 space-y-4 shadow-xl border border-rose-500/30">
            <div className="text-center space-y-2">
              <span className="text-3xl">⚠️</span>
              <h4 className="text-sm font-bold text-rose-500">
                Konfirmasi Hapus Perusahaan
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Apakah Anda yakin ingin menghapus <strong>"{deletingCompany.name}"</strong>?
              </p>
              <p className="text-[11px] text-rose-400/80 bg-rose-500/10 p-2 rounded">
                Semua ulasan siswa, pertanyaan Q&A, dan klaim terkait perusahaan ini juga akan terhapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                className="px-3 py-1.5 rounded-lg text-xs border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--accent-tint)]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteCompany}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm"
              >
                {submitting ? "Menghapus..." : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
