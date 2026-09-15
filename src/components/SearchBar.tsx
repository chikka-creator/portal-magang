"use client";

import { useState, useEffect, useRef } from "react";

interface SearchResult {
  id: string;
  name: string;
  city: string;
  industry: string | null;
}

interface SearchBarProps {
  onSelect?: (company: SearchResult) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSelect,
  placeholder = "Cari perusahaan...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/companies?search=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        if (data.success) {
          setResults(data.data.slice(0, 6));
          setIsOpen(true);
        }
      } catch {
        console.error("Search failed");
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (company: SearchResult) => {
    setQuery(company.name);
    setIsOpen(false);
    onSelect?.(company);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-primary)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all"
        />
        {isLoading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Minimalist Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 py-1 bg-[var(--bg-card)] border border-[var(--border-hover)] rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelect(company)}
              className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-[var(--accent-tint)] transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-[var(--accent-tint)] border border-[var(--border-primary)] flex items-center justify-center font-medium text-xs text-[var(--text-primary)] flex-shrink-0">
                {company.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">
                  {company.name}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {company.city}
                  {company.industry && ` · ${company.industry}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
