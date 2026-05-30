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
  ClipboardList,
  Columns2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Network,
  Repeat,
  Settings,
  Target,
  Timer,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/timer", label: "Cronômetro", icon: Timer },
  { href: "/subjects", label: "Matérias", icon: BookOpen },
  { href: "/split", label: "Tela dividida", icon: Columns2 },
  { href: "/notes", label: "Notas", icon: GraduationCap },
  { href: "/mindmaps", label: "Mapas mentais", icon: Network },
  { href: "/activities", label: "Atividades", icon: ClipboardList },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reviews", label: "Revisões", icon: Repeat },
  { href: "/calendar", label: "Calendário", icon: Calendar },
  { href: "/stats", label: "Estatísticas", icon: BarChart3 },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "relative hidden h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <svg viewBox="0 0 256 256" className="size-7 rounded-md" aria-hidden>
          <defs>
            <linearGradient id="sb-logo" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#4f46e5" />
              <stop offset="0.52" stopColor="#7c3aed" />
              <stop offset="1" stopColor="#9333ea" />
            </linearGradient>
            <linearGradient id="sb-hl" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#fb923c" />
            </linearGradient>
          </defs>
          <rect width="256" height="256" fill="url(#sb-logo)" />
          <g transform="rotate(-6 128 151)">
            <rect x="80" y="142" width="96" height="22" rx="11" fill="url(#sb-hl)" fillOpacity="0.92" />
          </g>
          <path
            d="M92 176 L92 80 L164 176 L164 80"
            fill="none"
            stroke="#fafafa"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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

        <button
          type="button"
          onClick={() => void signOut()}
          title={user?.email ?? "Sair"}
          className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate text-left">
              Sair{user?.email ? ` · ${user.email}` : ""}
            </span>
          )}
        </button>
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
