"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  seconds: number;
  size?: number;
  progress?: number;
  className?: string;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function TimerDisplay({
  seconds,
  size = 320,
  progress,
  className,
}: TimerDisplayProps) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const showProgress = typeof progress === "number";
  const dashOffset = showProgress
    ? circumference * (1 - Math.max(0, Math.min(1, progress!)))
    : 0;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border)"
          strokeWidth={stroke}
          fill="none"
        />
        {showProgress && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-chart-1)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.6s ease-out",
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-6xl font-light tabular-nums tracking-tight md:text-7xl">
          {h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
        </div>
      </div>
    </div>
  );
}
