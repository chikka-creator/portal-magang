"use client";

import { useState, useEffect } from "react";

const COMPARE_KEY = "portal_magang_compare";

export function getCompareList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(COMPARE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isInCompare(id: string): boolean {
  return getCompareList().includes(id);
}

export function toggleCompare(id: string): { added: boolean; limitReached: boolean; count: number } {
  if (typeof window === "undefined") return { added: false, limitReached: false, count: 0 };
  try {
    const list = getCompareList();
    if (list.includes(id)) {
      const nextList = list.filter((item) => item !== id);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(nextList));
      window.dispatchEvent(new Event("compare-change"));
      return { added: false, limitReached: false, count: nextList.length };
    } else {
      if (list.length >= 3) {
        return { added: false, limitReached: true, count: list.length };
      }
      const nextList = [...list, id];
      localStorage.setItem(COMPARE_KEY, JSON.stringify(nextList));
      window.dispatchEvent(new Event("compare-change"));
      return { added: true, limitReached: false, count: nextList.length };
    }
  } catch {
    return { added: false, limitReached: false, count: 0 };
  }
}

export function clearCompareList() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COMPARE_KEY);
  window.dispatchEvent(new Event("compare-change"));
}

export function useCompare() {
  const [compareList, setCompareList] = useState<string[]>([]);

  useEffect(() => {
    setCompareList(getCompareList());

    const handleStorage = () => setCompareList(getCompareList());
    window.addEventListener("compare-change", handleStorage);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("compare-change", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    compareList,
    isInCompare: (id: string) => compareList.includes(id),
    toggleCompare,
    clearCompareList,
  };
}
