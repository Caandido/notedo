"use client";

import { Loader2 } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthScreen } from "@/features/auth/auth-screen";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <Loader2 className="size-6 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  if (status === "anon") {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-background)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
