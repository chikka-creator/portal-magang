"use client";

import Sidebar from "@/components/Sidebar";
import ReviewForm from "@/components/ReviewForm";

export default function SubmitReviewPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* 1. Static Sidebar */}
      <Sidebar />

      {/* 2. Independently Scrollable Main Area */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-5 pt-12 lg:pt-0 pb-12">
          <div>
            <span className="badge-neutral font-mono text-[11px] mb-2 inline-block">
              100% Terenkripsi & Anonim
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
              Tulis Ulasan Pengalaman Magang
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
              Ceritakan pengalaman magangmu secara objektif. Data identitas (NISN) dienkripsi menggunakan standar SHA-256 dan tidak pernah disimpan dalam database.
            </p>
          </div>

          <div className="glass-card p-5 sm:p-6">
            <ReviewForm
              onSuccess={() => {
                window.location.href = "/";
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
