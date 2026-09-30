"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

/**
 * Lima AI Warm Oatmeal Sidebar Navigation
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const menu = document.getElementById("account-menu");
      if (menu && !menu.contains(e.target as Node)) setIsAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/companies",
      label: "Perusahaan",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      href: "/matchmaker",
      label: "AI Matchmaker",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      href: "/compare",
      label: "Perbandingan",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: "/bookmarks",
      label: "Favorit Saya",
      badge: "3",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      href: "/analytics",
      label: "Analitik & Tren",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
  ];

  const workspaceItems = [
    {
      href: "/companies?industry=Teknologi",
      label: "Jurusan RPL & TKJ",
      icon: (
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      href: "/companies?industry=Telekomunikasi",
      label: "Jurusan Telekomunikasi",
      icon: (
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      href: "/companies?industry=Manufaktur",
      label: "Sektor Manufaktur & Logistik",
      icon: (
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      href: "/companies?sort_by=stipend&sort_order=desc",
      label: "Uang Saku Tertinggi",
      icon: (
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64
          bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)]
          flex flex-col justify-between
          transition-transform duration-200 ease-out
          lg:translate-x-0 lg:relative lg:z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Top brand & navigation */}
        <div className="flex-1 overflow-y-auto">
          {/* Brand header */}
          <div className="p-4 flex items-center justify-between border-b border-[var(--border-primary)]">
            <Link
              href="/"
              className="flex items-center gap-2 group"
              onClick={() => setIsOpen(false)}
            >
              {/* Lima AI signature 8-point asterisk icon */}
              <div className="w-5 h-5 flex items-center justify-center text-[var(--text-primary)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a1 1 0 0 1 1 1v6.586l4.657-4.657a1 1 0 1 1 1.414 1.414L14.414 11H21a1 1 0 1 1 0 2h-6.586l4.657 4.657a1 1 0 0 1-1.414 1.414L13 14.414V21a1 1 0 1 1-2 0v-6.586l-4.657 4.657a1 1 0 0 1-1.414-1.414L9.586 13H3a1 1 0 1 1 0-2h6.586L4.929 6.343a1 1 0 0 1 1.414-1.414L11 9.586V3a1 1 0 0 1 1-1z" />
                </svg>
              </div>
              <span className="font-semibold text-xs tracking-wider text-[var(--text-primary)] uppercase">
                Portal Magang
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                onClick={() => setIsOpen(false)}
                className="hidden lg:flex items-center justify-center w-6 h-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs rounded hover:bg-[var(--accent-tint)]"
                title="Sembunyikan sidebar"
              >
                «
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Search Input Box with Command K badge */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    window.location.href = `/companies?search=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="w-full pl-8 pr-8 py-1.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] border border-[var(--border-primary)] px-1 py-0.2 rounded font-mono">
                ⌘K
              </span>
            </div>

            {/* Primary Action Button (+ Create) */}
            <Link
              href="/submit"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-primary)] text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create</span>
            </Link>

            {/* Main Menu */}
            <nav className="space-y-0.5 pt-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-150
                      ${
                        isActive
                          ? "bg-[var(--bg-active-nav)] text-[var(--text-active-nav)] font-semibold shadow-2xs"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? "text-[var(--text-active-nav)]" : "text-[var(--text-muted)]"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="w-4 h-4 rounded-full bg-[var(--accent-sage)] text-white text-[10px] flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Section: ■ WORKSPACE */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 mb-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                <span className="text-[7px]">■</span>
                <span>Workspace</span>
              </div>
              <div className="space-y-0.5">
                {workspaceItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] transition-colors"
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Section: ■ PENGATURAN */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 mb-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                <span className="text-[7px]">■</span>
                <span>Pengaturan</span>
              </div>
              <div className="space-y-0.5">
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Admin Control Panel</span>
                </Link>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === "dark" ? (
                      <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">{theme}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Footer with Dropdown Menu */}
        <div className="p-3 border-t border-[var(--border-primary)] relative" id="account-menu">
          <div className="relative">
            <button
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-[var(--accent-tint)] transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#43553E] text-[#F4F1EA] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                  A
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    Alex Morgan
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    SMK Surabaya • Pro Plan
                  </p>
                </div>
              </div>
              <span className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] text-sm px-1">
                ···
              </span>
            </button>

            {/* Dropdown Menu */}
            {isAccountMenuOpen && (
              <div className="absolute bottom-12 left-0 right-0 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  onClick={() => { router.push("/profile"); setIsAccountMenuOpen(false); setIsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("session");
                    router.push("/admin/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger-tint)] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
