"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const MAJORS = [
  { id: "rpl", label: "Rekayasa Perangkat Lunak (RPL)", icon: "💻" },
  { id: "tkj", label: "Teknik Komputer & Jaringan (TKJ)", icon: "🌐" },
  { id: "multimedia", label: "Desain Komunikasi Visual / MM", icon: "🎨" },
  { id: "mesin", label: "Teknik Mesin & Otomotif", icon: "⚙️" },
  { id: "akuntansi", label: "Akuntansi & Keuangan", icon: "📊" },
  { id: "pemasaran", label: "Bisnis Daring & Pemasaran", icon: "🛍️" },
  { id: "perkapalan", label: "Teknik Perkapalan / Las", icon: "🚢" },
  { id: "listrik", label: "Teknik Ketenagalistrikan", icon: "⚡" },
];

const PRIORITIES = [
  { id: "stipend", label: "Uang Saku & Kompensasi Tinggi", desc: "Mencari tempat magang dengan kompensasi bulanan paling baik" },
  { id: "mentorship", label: "Bimbingan Mentor Berkualitas", desc: "Fokus belajar keterampilan praktis dari mentor berpengalaman" },
  { id: "environment", label: "Lingkungan Kerja Supportif", desc: "Suasana kerja yang sehat, nyaman, dan ramah siswa magang" },
  { id: "balanced", label: "Seimbang (Semua Kriteria)", desc: "Mencari opsi seimbang antara belajar, budaya kerja, dan saku" },
];

export default function MatchmakerPage() {
  const [step, setStep] = useState(1);
  const [selectedMajor, setSelectedMajor] = useState("rpl");
  const [selectedPriority, setSelectedPriority] = useState("stipend");
  const [minStipend, setMinStipend] = useState(300000);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleRunMatchmaker = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/matchmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major: selectedMajor,
          priority: selectedPriority,
          minStipend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.matches || []);
        setStep(4); // Results step
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[var(--border-primary)] pb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Smart Recommendation Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Cari Tempat Magang Paling Cocok
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Algoritma pencocokan cerdas berdasarkan Jurusan SMK, prioritas kompensasi, dan ekspektasi bimbingan mentor.
          </p>
        </div>

        {/* Wizard Progress Bar */}
        {step <= 3 && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)]">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  step === s
                    ? "bg-[var(--accent-tint)] text-[var(--text-primary)] border border-[var(--border-hover)]"
                    : step > s
                    ? "text-emerald-400"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                  step === s ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]" : step > s ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--bg-secondary)]"
                }`}>
                  {step > s ? "✓" : s}
                </span>
                <span className="hidden sm:inline">
                  {s === 1 ? "1. Jurusan SMK" : s === 2 ? "2. Prioritas Utama" : "3. Min Uang Saku"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Jurusan SMK */}
        {step === 1 && (
          <div className="p-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] space-y-6">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Langkah 1: Apa Jurusan SMK Kamu?</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Pencocokan akan menyesuaikan tingkat relevansi industri dengan keahlian kamu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MAJORS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMajor(m.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedMajor === m.id
                      ? "border-blue-500 bg-blue-500/10 shadow-xs"
                      : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{m.label}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <span>Lanjut ke Prioritas →</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Prioritas Utama */}
        {step === 2 && (
          <div className="p-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] space-y-6">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Langkah 2: Apa yang Paling Kamu Utamakan?</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Setiap tempat magang memiliki keunggulan berbeda pada uang saku, mentor, atau budaya kerja.
              </p>
            </div>

            <div className="space-y-3">
              {PRIORITIES.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPriority(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    selectedPriority === p.id
                      ? "border-purple-500 bg-purple-500/10 shadow-xs"
                      : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">{p.label}</h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{p.desc}</p>
                  </div>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                    selectedPriority === p.id ? "border-purple-400 bg-purple-500 text-white" : "border-[var(--border-primary)]"
                  }`}>
                    {selectedPriority === p.id && "✓"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-[var(--border-primary)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ← Kembali
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <span>Lanjut ke Ekspektasi Uang Saku →</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Minimal Uang Saku */}
        {step === 3 && (
          <div className="p-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] space-y-6">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Langkah 3: Ekspektasi Minimal Uang Saku</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Tentukan perkiraan uang saku bulanan minimum yang kamu harapkan dari tempat magang.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-center space-y-4">
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                Rp {minStipend.toLocaleString("id-ID")} <span className="text-xs font-normal text-[var(--text-muted)]">/ bulan</span>
              </div>

              <input
                type="range"
                min={0}
                max={1000000}
                step={50000}
                value={minStipend}
                onChange={(e) => setMinStipend(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-[var(--border-primary)] accent-emerald-400 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>Rp 0 (Pengalaman saja)</span>
                <span>Rp 500.000 (Rata-rata Surabaya)</span>
                <span>Rp 1.000.000+</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl border border-[var(--border-primary)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                ← Kembali
              </button>
              <button
                onClick={handleRunMatchmaker}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
              >
                {loading ? "Menghitung Skor Match..." : "⚡ Hitung Rekomendasi Tempat Magang"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results Display */}
        {step === 4 && results && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Hasil Rekomendasi Ditemukan ({results.length})
                </span>
                <h2 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                  Top Rekomendasi Tempat Magang SMK Sesuai Kriteria Kamu
                </h2>
              </div>

              <button
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] text-xs font-medium hover:bg-[var(--accent-tint)] text-[var(--text-primary)] whitespace-nowrap"
              >
                🔄 Ulangi Tes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((c: any, index: number) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition-all space-y-4 relative overflow-hidden"
                >
                  {/* Rank Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[var(--accent-tint)] text-[11px] font-bold flex items-center justify-center border border-[var(--border-primary)]">
                        #{index + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">
                          {c.name}
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {c.city} • {c.industry || "Industri General"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.match_score}% Match
                      </span>
                      <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                        {c.badge_label}
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-1.5 bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-primary)]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Alasan Cocok Untukmu:
                    </span>
                    {c.highlights.map((h: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <span className="text-emerald-400">✓</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stat Snippets */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-lg bg-[var(--accent-tint)]">
                      <span className="text-[10px] text-[var(--text-muted)] block">Uang Saku</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {c.avg_stipend > 0 ? `Rp ${(c.avg_stipend / 1000).toFixed(0)}k` : "-"}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--accent-tint)]">
                      <span className="text-[10px] text-[var(--text-muted)] block">Lingkungan</span>
                      <span className="font-bold text-[var(--text-primary)]">★ {c.avg_env}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--accent-tint)]">
                      <span className="text-[10px] text-[var(--text-muted)] block">Mentorship</span>
                      <span className="font-bold text-[var(--text-primary)]">★ {c.avg_mentorship}</span>
                    </div>
                  </div>

                  <Link
                    href={`/companies/${c.id}`}
                    className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold text-xs hover:opacity-90 transition-opacity"
                  >
                    Buka Profil Perusahaan →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
