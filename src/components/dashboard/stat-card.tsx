import * as React from "react";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  hint?: string;
  accent?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  accent,
}: StatCardProps) {
  const positive = trend !== undefined && trend > 0;
  const negative = trend !== undefined && trend < 0;

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-5 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
              {label}
            </span>
            <span className="mt-1 text-2xl font-semibold tracking-tight">
              {value}
            </span>
          </div>
          <div
            className="flex size-9 items-center justify-center rounded-md text-[var(--color-foreground)]"
            style={{
              backgroundColor: accent
                ? `${accent}1a`
                : "var(--color-secondary)",
              color: accent ?? "var(--color-foreground)",
            }}
          >
            <Icon className="size-4" />
          </div>
        </div>

        {(trend !== undefined || hint) && (
          <div className="flex items-center gap-1.5 text-xs">
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  positive && "text-emerald-400",
                  negative && "text-rose-400",
                  !positive && !negative && "text-[var(--color-muted-foreground)]"
                )}
              >
                {positive ? (
                  <TrendingUp className="size-3" />
                ) : negative ? (
                  <TrendingDown className="size-3" />
                ) : null}
                {Math.abs(trend)}%
              </span>
            )}
            {hint && (
              <span className="text-[var(--color-muted-foreground)]">
                {hint}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
