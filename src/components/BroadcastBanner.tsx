"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function BroadcastBanner() {
  const pathname = usePathname();
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't fetch on admin routes
    if (pathname?.startsWith("/admin")) return;

    // Check if dismissed in session
    const isDismissed = sessionStorage.getItem("smk_broadcast_dismissed");
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    const fetchBroadcasts = async () => {
      try {
        const res = await fetch("/api/broadcasts");
        const json = await res.json();
        if (json.success && json.broadcasts?.length > 0) {
          setBroadcasts(json.broadcasts);
        }
      } catch (err) {
        console.error("Failed to load announcements:", err);
      }
    };

    fetchBroadcasts();
  }, [pathname]);

  if (pathname?.startsWith("/admin") || dismissed || broadcasts.length === 0) return null;

  const current = broadcasts[currentIndex];

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("smk_broadcast_dismissed", "true");
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-500/30";
      case "warning":
        return "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500/30";
      default:
        return "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500/30";
    }
  };

  return (
    <div
      className={`w-full py-2.5 px-4 shadow-sm border-b text-xs transition-all relative z-40 ${getPriorityStyle(
        current.priority
      )}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <span className="shrink-0 text-sm">
            {current.priority === "urgent" ? "🚨" : current.priority === "warning" ? "⚠️" : "📢"}
          </span>
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold shrink-0">{current.title}:</span>
            {current.body && (
              <span className="opacity-90 truncate hidden sm:inline">{current.body}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {broadcasts.length > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-mono opacity-80">
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev > 0 ? prev - 1 : broadcasts.length - 1))
                }
                className="px-1 hover:opacity-100"
              >
                ◀
              </button>
              <span>
                {currentIndex + 1}/{broadcasts.length}
              </span>
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev < broadcasts.length - 1 ? prev + 1 : 0))
                }
                className="px-1 hover:opacity-100"
              >
                ▶
              </button>
            </div>
          )}

          <button
            onClick={handleDismiss}
            title="Tutup pengumuman"
            className="p-1 rounded hover:bg-white/20 transition-colors text-white text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
