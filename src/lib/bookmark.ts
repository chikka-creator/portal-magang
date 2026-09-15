"use client";

import { useState, useEffect } from "react";

const BOOKMARK_KEY = "portal_magang_bookmarks";

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(BOOKMARK_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().includes(id);
}

export function toggleBookmark(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getBookmarks();
    let nextList: string[];
    let added = false;

    if (list.includes(id)) {
      nextList = list.filter((item) => item !== id);
    } else {
      nextList = [...list, id];
      added = true;
    }

    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(nextList));
    window.dispatchEvent(new Event("bookmark-change"));
    return added;
  } catch {
    return false;
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());

    const handleStorage = () => setBookmarks(getBookmarks());
    window.addEventListener("bookmark-change", handleStorage);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("bookmark-change", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return {
    bookmarks,
    isBookmarked: (id: string) => bookmarks.includes(id),
    toggleBookmark,
  };
}
