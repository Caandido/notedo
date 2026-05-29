"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SignInForm } from "./sign-in-form";

export function AuthScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
            <span className="text-xl font-bold">N</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Notedo</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Entre para sincronizar seus estudos entre dispositivos.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <SignInForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[var(--color-muted-foreground)]">
          Seus dados sincronizam quando há internet e ficam disponíveis offline.
        </p>
      </div>
    </div>
  );
}
