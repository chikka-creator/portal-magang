"use client";

import React from "react";

interface DistributionProps {
  distribution: {
    score: number;
    environmentCount: number;
    mentorshipCount: number;
  }[];
}

export default function DistributionChart({ distribution }: DistributionProps) {
  if (!distribution || distribution.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Data sebaran tidak tersedia</p>;
  }

  const maxCount = Math.max(
    ...distribution.map((d) => Math.max(d.environmentCount, d.mentorshipCount)),
    1
  );

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-end gap-4 text-[11px] text-muted-foreground pb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
          <span>Lingkungan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>Mentorship</span>
        </div>
      </div>

      {[5, 4, 3, 2, 1].map((score) => {
        const item = distribution.find((d) => d.score === score) || {
          score,
          environmentCount: 0,
          mentorshipCount: 0,
        };

        const envWidth = Math.round((item.environmentCount / maxCount) * 100);
        const mentorWidth = Math.round((item.mentorshipCount / maxCount) * 100);

        return (
          <div key={score} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 font-mono font-medium text-foreground">
                ★ {score}
              </span>

              <div className="flex-1 space-y-1">
                {/* Environment bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(envWidth, 2)}%` }}
                  />
                </div>
                {/* Mentorship bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(mentorWidth, 2)}%` }}
                  />
                </div>
              </div>

              <div className="w-14 text-right font-mono text-[11px] text-muted-foreground">
                {item.environmentCount + item.mentorshipCount}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
