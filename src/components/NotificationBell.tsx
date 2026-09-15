"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";

/* ───────────────────────────────────────────────────
   Notification Type Icon & Category Colors
   ─────────────────────────────────────────────────── */
function NotifIcon({ type }: { type?: string }) {
  const base = "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105";

  // Reply from company
  if (type?.includes("reply")) {
    return (
      <span className={base} style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </span>
    );
  }

  // Helpful vote / upvote
  if (type?.includes("vote") || type?.includes("helpful")) {
    return (
      <span className={base} style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}>
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </span>
    );
  }

  // Claim or verification
  if (type?.includes("claim") || type?.includes("verify")) {
    return (
      <span className={base} style={{ background: "rgba(168,85,247,0.12)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }}>
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </span>
    );
  }

  // Flag or moderation
  if (type?.includes("flag") || type?.includes("report")) {
    return (
      <span className={base} style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </span>
    );
  }

  // Review or feedback
  if (type?.includes("review")) {
    return (
      <span className={base} style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}>
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </span>
    );
  }

  // Default Info
  return (
    <span className={base} style={{ background: "var(--accent-tint)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}>
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
  );
}

/* ───────────────────────────────────────────────────
   Main Component
   ─────────────────────────────────────────────────── */
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const [isWiggling, setIsWiggling] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const newNotifs = data.notifications || [];
        const newCount = data.unreadCount || 0;

        if (newCount > unreadCount && unreadCount >= 0) {
          setIsWiggling(true);
          setTimeout(() => setIsWiggling(false), 1000);
        }

        setNotifications(newNotifs);
        setUnreadCount(newCount);
      }
    } catch {
      // ignore
    }
  }, [unreadCount]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark single item as read
  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  // Filtered list
  const displayedNotifications = filterTab === "unread" 
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* ──────────────── Trigger Button ──────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pusat Notifikasi"
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 outline-none ${
          isOpen
            ? "bg-[var(--accent-tint)] border-[var(--border-focus)] text-[var(--text-primary)] shadow-sm"
            : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--accent-tint)]"
        }`}
        style={{
          animation: isWiggling ? "wiggle 0.7s cubic-bezier(.36,.07,.19,.97) both" : undefined,
        }}
      >
        <svg
          className="w-4.5 h-4.5 transition-transform duration-200 active:scale-95"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge with pulse glow */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] tracking-tight shadow-sm ring-2 ring-[var(--bg-primary)] animate-in zoom-in duration-200">
            <span className="absolute inset-0 rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* ──────────────── Dropdown Panel ──────────────── */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2.5 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-[var(--border-hover)] bg-[var(--bg-card)]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            boxShadow: "0 20px 40px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-tight text-[var(--text-primary)]">
                  Pusat Notifikasi
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {unreadCount} baru
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)]">
              <button
                onClick={() => setFilterTab("all")}
                className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-medium transition-all ${
                  filterTab === "all"
                    ? "bg-[var(--accent-tint)] text-[var(--text-primary)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                onClick={() => setFilterTab("unread")}
                className={`flex-1 py-1 px-2.5 rounded-md text-[11px] font-medium transition-all ${
                  filterTab === "unread"
                    ? "bg-[var(--accent-tint)] text-[var(--text-primary)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>
          </div>

          {/* List Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border-primary)]">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-tint)] border border-[var(--border-primary)] flex items-center justify-center mb-3 text-[var(--text-muted)]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {filterTab === "unread" ? "Semua notifikasi sudah dibaca" : "Belum ada notifikasi"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Aktivitas terkait ulasan dan perusahaan akan muncul di sini.
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => {
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={`group relative p-3.5 transition-all duration-150 flex gap-3 items-start cursor-pointer ${
                      n.is_read
                        ? "bg-transparent hover:bg-[var(--accent-tint)]/50 opacity-75 hover:opacity-100"
                        : "bg-blue-500/[0.04] hover:bg-blue-500/[0.08]"
                    }`}
                  >
                    {/* Unread Glow Dot */}
                    {!n.is_read && (
                      <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    )}

                    {/* Icon by Type */}
                    <NotifIcon type={n.type} />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-xs leading-snug ${
                            n.is_read
                              ? "font-medium text-[var(--text-secondary)]"
                              : "font-semibold text-[var(--text-primary)]"
                          }`}
                        >
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono whitespace-nowrap flex-shrink-0 pt-0.5">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>

                      {n.body && (
                        <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                          {n.body}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        {n.reference_id ? (
                          <Link
                            href={`/companies/${n.reference_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <span>Lihat rincian</span>
                            <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ) : <span />}

                        {/* Mark read button on hover */}
                        {!n.is_read && (
                          <button
                            onClick={(e) => markAsRead(n.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10.5px] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1.5 py-0.5 rounded hover:bg-[var(--accent-tint)]"
                            title="Tandai dibaca"
                          >
                            ✓ Baca
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 flex items-center justify-between text-[11px] text-[var(--text-muted)] px-3.5">
            <span>
              {notifications.filter((n) => n.is_read).length} dari {notifications.length} ulasan/tanggapan dibaca
            </span>
            <span className="text-[10px] font-mono opacity-75">Auto-refresh</span>
          </div>
        </div>
      )}

      {/* Animation Style */}
      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-12deg); }
          40% { transform: rotate(10deg); }
          60% { transform: rotate(-6deg); }
          80% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
