"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarView } from "@/components/calendar/calendar-view";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getCalendarMonth, getSubjectsForUser } from "@/lib/queries";

export function DashboardCalendar() {
  const now = new Date();
  const [ym, setYm] = React.useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const calQ = useRepoQuery(
    () => getCalendarMonth(ym.year, ym.month),
    [ym.year, ym.month]
  );
  const subjQ = useRepoQuery(() => getSubjectsForUser(), []);

  if (calQ.loading || !calQ.data || subjQ.loading || !subjQ.data) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center text-[var(--color-muted-foreground)]">
          <Loader2 className="size-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <CalendarView
      year={ym.year}
      month={ym.month}
      days={calQ.data.days}
      subjects={subjQ.data.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
      }))}
      onNavigate={(year, month) => setYm({ year, month })}
    />
  );
}
