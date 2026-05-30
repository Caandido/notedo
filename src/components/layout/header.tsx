"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Columns2, Plus, Search } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-6 backdrop-blur-md">
      <div className="flex min-w-0 flex-col">
        {title && (
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="truncate text-xs text-[var(--color-muted-foreground)]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="search"
            placeholder="Buscar..."
            className="h-8 w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] pl-8 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none transition-colors focus:border-[var(--color-ring)]"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 font-mono text-[10px] text-[var(--color-muted-foreground)] sm:flex">
            ⌘K
          </kbd>
        </div>
        <Link
          href="/split"
          aria-label="Tela dividida"
          title="Tela dividida — abrir matérias lado a lado"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <Columns2 className="size-4" />
        </Link>
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="size-4" />
        </Button>
        <ThemeToggle />
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Nova sessão
        </Button>
      </div>
    </header>
  );
}
