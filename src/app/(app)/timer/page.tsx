import { Header } from "@/components/layout/header";
import { TimerPageContent } from "@/components/timer/timer-page";
import { getSubjectsForUser } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TimerPage() {
  const subjects = await getSubjectsForUser();

  return (
    <>
      <Header
        title="Cronômetro"
        subtitle="Pomodoro, livre, reverso e custom"
      />
      <TimerPageContent
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        }))}
      />
    </>
  );
}
