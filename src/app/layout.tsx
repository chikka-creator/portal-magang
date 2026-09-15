import type { Metadata } from "next";
import "./globals.css";
import BroadcastBanner from "@/components/BroadcastBanner";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import { isMaintenanceMode } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Portal Magang SMK — Reputasi & Kompensasi Prakerin",
  description:
    "Platform anonim untuk siswa SMK berbagi pengalaman magang (Prakerin/PKL). " +
    "Lihat review, skor lingkungan kerja, mentorship, dan uang saku dari perusahaan di Surabaya.",
  keywords: [
    "magang SMK",
    "prakerin",
    "PKL",
    "review magang",
    "uang saku magang",
    "Surabaya",
    "SMK",
    "kompensasi magang",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const maintenanceMode = await isMaintenanceMode();

  return (
    <html lang="id" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      {/*
        LAYOUT RULE (from spec):
        h-screen + overflow-hidden on the body ensures
        NO global window scroll. Only the main content area scrolls.
      */}
      <body className="h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased flex flex-col">
        <MaintenanceGuard initialMaintenance={maintenanceMode} />
        <BroadcastBanner />
        <div className="flex-1 h-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
