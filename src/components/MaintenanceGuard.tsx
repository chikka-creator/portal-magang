"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function MaintenanceGuard({
  initialMaintenance = false,
}: {
  initialMaintenance?: boolean;
}) {
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState(initialMaintenance);
  const [contactEmail, setContactEmail] = useState("support@portalmagang.id");

  useEffect(() => {
    // Admin routes are never blocked by maintenance mode
    if (pathname?.startsWith("/admin")) {
      setIsMaintenance(false);
      return;
    }

    const checkMaintenance = async () => {
      try {
        const res = await fetch("/api/settings/public", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.settings) {
          setIsMaintenance(json.settings.maintenance_mode === true);
          if (json.settings.platform_contact_email) {
            setContactEmail(json.settings.platform_contact_email);
          }
        }
      } catch (err) {
        console.error("Failed to check maintenance mode:", err);
      }
    };

    checkMaintenance();

    // Check periodically every 5 seconds so status changes are picked up quickly
    const interval = setInterval(checkMaintenance, 5000);

    // Also check immediately when window regains focus
    const onFocus = () => checkMaintenance();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  // If not in maintenance mode or route is admin, render nothing
  if (!isMaintenance || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-lg w-full bg-[#141417]/95 border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        {/* Animated Icon with Glow */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center relative shadow-lg">
          <div className="absolute inset-0 rounded-2xl bg-rose-500/20 animate-ping opacity-25" />
          <span className="text-4xl">🛠️</span>
        </div>

        {/* Status Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Mode Pemeliharaan Aktif
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Portal Magang SMK Sedang Ditingkatkan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            Kami sedang melakukan pemeliharaan rutin dan peningkatan sistem guna memastikan performa, stabilitas, dan keamanan data portal berjalan dengan optimal.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left text-xs">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              Status Operasional
            </span>
            <p className="text-zinc-200 font-medium">Pembaruan Berkala</p>
            <p className="text-[11px] text-zinc-400">Portal akan segera dibuka kembali.</p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              Bantuan & Dukungan
            </span>
            <p className="text-zinc-200 font-medium truncate">{contactEmail}</p>
            <a
              href={`mailto:${contactEmail}`}
              className="text-[11px] text-indigo-400 hover:underline block truncate"
            >
              Kirim email pertanyaan ↗
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-white/[0.08]">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🔄</span>
            <span>Muat Ulang Halaman</span>
          </button>

          <Link
            href="/admin/login"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-all flex items-center justify-center gap-1.5"
          >
            <span>🔐</span>
            <span>Login Administrator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
