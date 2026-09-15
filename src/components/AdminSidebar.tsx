"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingFlagsCount?: number;
  pendingClaimsCount?: number;
}

export default function AdminSidebar({
  currentTab,
  onSelectTab,
  pendingFlagsCount = 0,
  pendingClaimsCount = 0,
}: AdminSidebarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  const navGroups = [
    {
      group: "Insight & Ringkasan",
      items: [
        {
          id: "overview",
          label: "Overview",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          ),
        },
        {
          id: "analytics",
          label: "Analitik Platform",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          ),
        },
      ],
    },
    {
      group: "Moderasi & Konten",
      items: [
        {
          id: "reviews",
          label: "Moderasi Ulasan",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          ),
        },
        {
          id: "flags",
          label: "Laporan Siswa",
          badge: pendingFlagsCount > 0 ? pendingFlagsCount : undefined,
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
            />
          ),
        },
        {
          id: "questions",
          label: "Moderasi Q&A",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        },
        {
          id: "claims",
          label: "Klaim Perusahaan",
          badge: pendingClaimsCount > 0 ? pendingClaimsCount : undefined,
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          ),
        },
      ],
    },
    {
      group: "Manajemen & Sistem",
      items: [
        {
          id: "companies",
          label: "Data Perusahaan",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          ),
        },
        {
          id: "broadcasts",
          label: "Pengumuman",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          ),
        },
        {
          id: "audit",
          label: "Audit Trail",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          ),
        },
        {
          id: "settings",
          label: "Pengaturan & Akun",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
          ),
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-card border border-border shadow-md text-foreground"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay on mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 flex-shrink-0 flex flex-col justify-between
          bg-[var(--bg-card)] border-r border-[var(--border-primary)]
          p-4 transition-transform duration-200 overflow-y-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="px-2 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                Admin Control Center
              </h2>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Portal Magang SMK v2.0
            </p>
          </div>

          {/* Nav Groups */}
          <nav className="space-y-4">
            {navGroups.map((grp, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {grp.group}
                </div>
                <div className="space-y-0.5">
                  {grp.items.map((item) => {
                    const active = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectTab(item.id);
                          setMobileOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium
                          transition-colors duration-150
                          ${
                            active
                              ? "bg-[var(--accent-tint)] text-[var(--text-primary)] border border-[var(--border-hover)] shadow-xs"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)]"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 opacity-75 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {item.icon}
                          </svg>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-[var(--border-primary)] space-y-1">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] transition-colors"
          >
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Portal</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
