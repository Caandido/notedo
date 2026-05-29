import type { CapacitorConfig } from "@capacitor/cli";

// Empacota o SPA estático (out/) num app Android.
// O projeto nativo android/ é gerado no CI (npx cap add android) — não versionado.
const config: CapacitorConfig = {
  appId: "app.notedo",
  appName: "Notedo",
  webDir: "out",
  android: {
    // SPA client-side, sem servidor — usa o esquema https local do Capacitor.
    allowMixedContent: false,
  },
};

export default config;
