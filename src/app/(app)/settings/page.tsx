import { Header } from "@/components/layout/header";
import { SettingsView } from "@/components/settings/settings-view";
import { getProfileSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getProfileSummary();

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
