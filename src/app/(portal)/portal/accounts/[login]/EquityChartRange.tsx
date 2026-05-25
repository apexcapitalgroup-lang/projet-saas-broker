"use client";

import * as React from "react";
import { AreaChart } from "@/components/ui";

const RANGES = ["30d", "3m", "1y", "All"] as const;
type Range = (typeof RANGES)[number];

const SERIES: Record<Range, number[]> = {
  "30d": [82, 84, 81, 86, 88, 87, 92, 94, 91, 95, 96, 98, 97, 99, 100, 99, 101, 102, 100, 103, 104, 105, 104, 106, 107, 105, 108, 110, 112],
  "3m":  [62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112],
  "1y":  [38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78, 82, 86, 90, 94, 98, 102, 106, 110, 112],
  "All": [10, 14, 18, 22, 28, 34, 40, 46, 52, 58, 64, 70, 76, 82, 88, 94, 100, 108, 112],
};

export function EquityChartRange() {
  const [range, setRange] = React.useState<Range>("30d");
  return (
    <>
      <div className="flex items-center gap-1 -mt-7 mb-2 justify-end">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`btn-ghost ${
              r === range ? "text-[var(--color-brand)] bg-[var(--color-brand-soft)]" : ""
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <AreaChart data={SERIES[range]} height={220} />
    </>
  );
}
