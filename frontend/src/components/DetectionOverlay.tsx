"use client";

import type { Detection } from "@/lib/types";

type Props = {
  detections: Detection[];
  naturalWidth: number;
  naturalHeight: number;
};

/** Simple absolute bbox overlay scaled to the rendered image box. */
export function DetectionOverlay({
  detections,
  naturalWidth,
  naturalHeight,
}: Props) {
  if (!detections.length || !naturalWidth || !naturalHeight) {
    return null;
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {detections.map((d, i) => {
        const [x1, y1, x2, y2] = d.bbox;
        const w = Math.max(0, x2 - x1);
        const h = Math.max(0, y2 - y1);
        const label = `${d.class} ${(d.confidence * 100).toFixed(0)}%`;
        return (
          <g key={`${d.class}-${i}`}>
            <rect
              x={x1}
              y={y1}
              width={w}
              height={h}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={Math.max(2, naturalWidth * 0.002)}
              opacity={0.9}
            />
            <text
              x={x1 + 4}
              y={Math.max(14, y1 - 6)}
              fill="var(--accent)"
              fontSize={Math.max(12, naturalWidth * 0.012)}
              fontFamily="var(--font-body), sans-serif"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
