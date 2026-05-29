import type { NextConfig } from "next";

// Offline-first SPA: static export para empacotar em Capacitor (APK) e Tauri (EXE).
// O app é 100% client-side (Dexie/IndexedDB), então não há server runtime.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // URLs como /subject/ resolvem para subject/index.html — necessário em file://
  trailingSlash: true,
};

export default nextConfig;
