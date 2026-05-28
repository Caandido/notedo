"use client";

import { Header } from "@/components/layout/header";
import { PageLoading } from "@/components/layout/page-loading";
import { SettingsView } from "@/components/settings/settings-view";
import { useRepoQuery } from "@/lib/db/use-repo";
import { getProfileSummary } from "@/lib/queries";

export default function SettingsPage() {
  const { data: profile, loading } = useRepoQuery(
    () => getProfileSummary(),
    []
  );
  if (loading || !profile) return <PageLoading />;

  return (
    <>
      <Header
        title="Configurações"
        subtitle="Preferências, perfil e defaults"
      />
      <SettingsView profile={profile} />
    </>
  );
}
