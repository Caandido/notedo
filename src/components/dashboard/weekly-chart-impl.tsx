"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyChartImplProps {
  data: { day: string; hours: number }[];
}

export function WeeklyChartImpl({ data }: WeeklyChartImplProps) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
        >
          <defs>
            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-chart-1)"
                stopOpacity={0.45}
              />
              <stop
                offset="100%"
                stopColor="var(--color-chart-1)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--color-border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 11,
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "var(--color-muted-foreground)",
              fontSize: 11,
            }}
            width={32}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)" }}
            contentStyle={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--color-foreground)",
            }}
            labelStyle={{ color: "var(--color-muted-foreground)" }}
            formatter={(value) => [`${Number(value).toFixed(1)}h`, "Horas"]}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            fill="url(#hoursGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
