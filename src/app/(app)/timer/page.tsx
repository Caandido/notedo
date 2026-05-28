import { Header } from "@/components/layout/header";
import { TimerPageContent } from "@/components/timer/timer-page";

export default function TimerPage() {
  return (
    <>
      <Header
        title="Cronômetro"
        subtitle="Pomodoro, livre, reverso e custom"
      />
      <TimerPageContent />
    </>
  );
}
