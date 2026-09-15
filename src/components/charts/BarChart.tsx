"use client";

import React from "react";
import { formatRupiah } from "@/lib/format";

interface BarChartItem {
  label: string;
  value: number;
  subValue?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  formatAsCurrency?: boolean;
}

export default function BarChart({
  data,
  title,
  formatAsCurrency = true,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Data tidak tersedia</p>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {title}
        </h4>
      )}
      <div className="space-y-3">
        {data.map((item, idx) => {
          const percentage = Math.round((item.value / maxValue) * 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                  {item.label}
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatAsCurrency ? formatRupiah(item.value) : item.value}
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex items-center">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                />
              </div>
              {item.subValue && (
                <p className="text-[10px] text-muted-foreground text-right">
                  {item.subValue}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
