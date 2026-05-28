import { Header } from "@/components/layout/header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { formatHours } from "@/lib/utils";
import { getCalendarMonth } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{ y?: string; m?: string }>;
}

function parseInt0(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt0(params.y, now.getFullYear());
  const monthRaw = parseInt0(params.m, now.getMonth());
  const month = Math.max(0, Math.min(11, monthRaw));

  const data = await getCalendarMonth(year, month);

  return (
    <>
      <Header
        title="Calendário"
        subtitle={`${formatHours(data.totalSeconds)} em ${data.activeDays} dia${data.activeDays === 1 ? "" : "s"} ativo${data.activeDays === 1 ? "" : "s"} · ${data.sessionCount} sessões · ${data.reviewCount} revisões`}
      />
      <div className="p-6">
        <CalendarView year={year} month={month} days={data.days} />
      </div>
    </>
  );
}
