"use client";

import React from "react";
import { CompanyReply } from "@/lib/types";

interface CompanyReplyCardProps {
  reply: CompanyReply;
}

export default function CompanyReplyCard({ reply }: CompanyReplyCardProps) {
  const formattedDate = new Date(reply.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-3 pl-4 border-l-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-r-lg p-3 text-sm transition-all duration-150">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          Tanggapan Resmi Perusahaan
        </span>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>
      <p className="text-foreground leading-relaxed text-xs sm:text-sm">
        {reply.reply_text}
      </p>
    </div>
  );
}
