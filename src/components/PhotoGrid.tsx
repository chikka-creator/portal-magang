"use client";

import { useState } from "react";

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
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] transition-all duration-200 hover:border-[var(--border-hover)]"
          >
            {/* STRICT 3:4 ASPECT RATIO CONTAINER (as per spec) */}
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
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/70 text-zinc-200 backdrop-blur-sm border border-white/10">
                    {photo.tag}
                  </span>
                </div>
              )}

              {/* Caption */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <p className="text-xs font-normal text-zinc-200 line-clamp-2 leading-tight">
                  {photo.caption}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-sm w-full mx-4 overflow-hidden rounded-xl bg-[var(--bg-card)] border border-[var(--border-hover)] shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-black">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  {selectedPhoto.caption}
                </p>
                {selectedPhoto.tag && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Kategori: {selectedPhoto.tag}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="btn-ghost text-xs py-1 px-2.5"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
