"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Repeat,
  Settings,
  Target,
  Timer,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timer", label: "Cronômetro", icon: Timer },
  { href: "/subjects", label: "Matérias", icon: BookOpen },
  { href: "/notes", label: "Notas", icon: GraduationCap },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reviews", label: "Revisões", icon: Repeat },
  { href: "/calendar", label: "Calendário", icon: Calendar },
  { href: "/stats", label: "Estatísticas", icon: BarChart3 },
] as const;

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

export function Sidebar({ user }: { user?: SidebarUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "relative flex h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-[width] duration-200 ease-out",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
          <span className="text-sm font-bold">N</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight">Notedo</span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-[var(--color-border)] p-2">
        <Link
          href="/settings"
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
              : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
          )}
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </Link>

        {user && (
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5",
              collapsed && "justify-center"
            )}
          >
            <UserMenu user={user} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {user.name ?? "Conta"}
                </p>
                {user.email && (
                  <p className="truncate text-[10px] text-[var(--color-muted-foreground)]">
                    {user.email}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-7 size-6 rounded-full border-[var(--color-border)] bg-[var(--color-card)] opacity-0 transition-opacity hover:bg-[var(--color-accent)] group-hover:opacity-100 hover:opacity-100"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? (
          <ChevronRight className="size-3" />
        ) : (
          <ChevronLeft className="size-3" />
        )}
      </Button>
    </aside>
  );
}
