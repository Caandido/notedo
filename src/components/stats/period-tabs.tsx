"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const PERIODS = [
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
  { id: "90", label: "90 dias" },
  { id: "365", label: "1 ano" },
] as const;

interface PeriodTabsProps {
  current: string;
}

export function PeriodTabs({ current }: PeriodTabsProps) {
  const pathname = usePathname();
  const params = useSearchParams();

  function hrefFor(id: string) {
    const next = new URLSearchParams(params);
    next.set("period", id);
    return `${pathname}?${next.toString()}`;
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1">
      {PERIODS.map((p) => (
        <Link
          key={p.id}
          href={hrefFor(p.id)}
          replace
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            current === p.id
              ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
              : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          )}
          aria-current={current === p.id ? "page" : undefined}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
