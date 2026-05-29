"use client";

import { Header } from "@/components/layout/header";
import { NewActivityForm } from "@/components/activities/new-activity-form";
import { ActivitiesView } from "@/components/activities/activities-view";

export default function ActivitiesPage() {
  return (
    <>
      <Header title="Atividades" subtitle="Atividades, redações, trabalhos e exercícios" />
      <div className="px-6 pt-6">
        <NewActivityForm />
      </div>
      <ActivitiesView />
    </>
  );
}
