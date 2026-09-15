"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import BarChart from "@/components/charts/BarChart";
import RadarChart from "@/components/charts/RadarChart";
import LineChart from "@/components/charts/LineChart";
import DistributionChart from "@/components/charts/DistributionChart";
import type { AnalyticsData } from "@/lib/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          {/* Header */}
          <div className="pt-12 lg:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Analitik & Komparasi Prakerin
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Eksplorasi tren kompensasi uang saku dan kualitas bimbingan magang di Surabaya
              </p>
            </div>

            <a
              href="/api/export?format=csv&type=companies"
              download
              className="btn-ghost text-xs py-2 px-3 border border-[var(--border-primary)] inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Ekspor Data (CSV)
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 rounded-xl skeleton" />
              <div className="h-64 rounded-xl skeleton" />
              <div className="h-64 rounded-xl skeleton" />
              <div className="h-64 rounded-xl skeleton" />
            </div>
          ) : !data ? (
            <div className="p-8 text-center text-xs text-muted-foreground glass-card">
              Gagal memuat data analitik.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grid 1: Bar Chart & Radar Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Bar Chart: Stipend by Industry */}
                <div className="glass-card p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Uang Saku Rata-Rata per Industri
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Perbandingan nominal tunjangan magang antar sektor
                    </p>
                  </div>
                  <BarChart
                    data={data.industryAverages.map((ind) => ({
                      label: ind.industry,
                      value: ind.avgStipend,
                      subValue: `${ind.reviewCount} ulasan • Skor ${ind.avgEnvironment}`,
                    }))}
                  />
                </div>

                {/* 2. Radar Chart: Top 3 Companies Multi-dimension */}
                <div className="glass-card p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Radar Kualitas Top 3 Perusahaan
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Perbandingan 3 dimensi: Lingkungan, Mentorship & Uang Saku
                    </p>
                  </div>
                  <RadarChart companies={data.topCompaniesComparison} />
                </div>
              </div>

              {/* Grid 2: Line Chart & Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 3. Line Chart: Timeline Growth */}
                <div className="glass-card p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Tren Ulasan Masuk
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Aktivitas pengiriman ulasan oleh siswa SMK
                    </p>
                  </div>
                  <LineChart data={data.monthlyTrends} />
                </div>

                {/* 4. Score Distribution */}
                <div className="glass-card p-5 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      Distribusi Skor Evaluasi (1 - 5 Bintang)
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Perbandingan persebaran rating lingkungan vs mentor
                    </p>
                  </div>
                  <DistributionChart distribution={data.scoreDistribution} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
