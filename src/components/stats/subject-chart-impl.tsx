"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface ImplProps {
  data: { id: string; name: string; color: string; hours: number }[];
}

export function Impl({ data }: ImplProps) {
  const total = data.reduce((a, s) => a + s.hours, 0);

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="h-56 w-full sm:w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="hours"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--color-foreground)",
              }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              formatter={(value) => [`${Number(value).toFixed(1)}h`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 space-y-2">
        {data.map((s) => {
          const pct = total > 0 ? (s.hours / total) * 100 : 0;
          return (
            <li key={s.id} className="flex items-center gap-3 text-xs">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="min-w-0 flex-1 truncate font-medium">
                {s.name}
              </span>
              <span className="tabular-nums text-[var(--color-muted-foreground)]">
                {s.hours.toFixed(1)}h
              </span>
              <span className="w-10 text-right tabular-nums text-[var(--color-muted-foreground)]">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
