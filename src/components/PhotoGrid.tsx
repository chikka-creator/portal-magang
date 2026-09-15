"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  tag?: string;
}

interface PhotoGridProps {
  photos?: PhotoItem[];
  companyName?: string;
}

const DEFAULT_PHOTOS: Record<string, PhotoItem[]> = {
  default: [
    {
      id: "p1",
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&h=800&q=80",
      caption: "Area Kerja & Ruang Diskusi",
      tag: "Fasilitas",
    },
    {
      id: "p2",
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=800&q=80",
      caption: "Kolaborasi Tim & Mentoring",
      tag: "Mentorship",
    },
    {
      id: "p3",
      url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&h=800&q=80",
      caption: "Laboratorium & Praktik Teknis",
      tag: "Praktek",
    },
    {
      id: "p4",
      url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&h=800&q=80",
      caption: "Sesi Pembekalan Mingguan",
      tag: "Evaluasi",
    },
  ],
};

export default function PhotoGrid({ photos, companyName }: PhotoGridProps) {
  const displayPhotos = photos && photos.length > 0 ? photos : DEFAULT_PHOTOS.default;
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPhoto(null);
      }
    };
    if (selectedPhoto) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhoto]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Foto Lingkungan Kerja
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Dokumentasi suasana magang {companyName ? `di ${companyName}` : ""}
          </p>
        </div>
        <span className="badge-neutral font-mono text-[10px]">
          3:4 Portrait
        </span>
      </div>

      {/* Grid of 3:4 Portrait Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] transition-all duration-200 hover:border-[var(--border-hover)] hover:shadow-md"
          >
            {/* STRICT 3:4 ASPECT RATIO CONTAINER */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-black/40">
              <img
                src={photo.url}
                alt={photo.caption}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Minimal gradient vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Tag */}
              {photo.tag && (
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/75 text-zinc-200 backdrop-blur-sm border border-white/10">
                    {photo.tag}
                  </span>
                </div>
              )}

              {/* Caption */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <p className="text-xs font-medium text-zinc-100 line-clamp-2 leading-tight">
                  {photo.caption}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal rendered via Portal to prevent any parent transform/overflow glitch */}
      {selectedPhoto && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in-0 duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hover)] shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            {/* Modal Header */}
            <div className="p-3.5 px-4 flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2 min-w-0">
                {selectedPhoto.tag && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
                    {selectedPhoto.tag}
                  </span>
                )}
                <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {selectedPhoto.caption}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                aria-label="Tutup popup foto"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-tint)] transition-colors flex-shrink-0 ml-2 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Photo Container */}
            <div className="relative w-full max-h-[60vh] flex-1 overflow-hidden bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-4 flex items-center justify-between border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <p className="text-xs text-[var(--text-muted)] truncate mr-2">
                {companyName ? `Dokumentasi magang di ${companyName}` : "Dokumentasi magang SMK"}
              </p>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="btn-primary text-xs py-1.5 px-4 flex-shrink-0"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
