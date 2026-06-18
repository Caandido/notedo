"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  MoreHorizontal,
  Network,
  PencilRuler,
  Repeat,
  Settings,
  Target,
  Timer,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";

type Item = { href: string; label: string; icon: LucideIcon };

// 4 telas principais na barra; o resto vai no menu "Mais".
const PRIMARY: Item[] = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/timer", label: "Cronômetro", icon: Timer },
  { href: "/subjects", label: "Matérias", icon: BookOpen },
  { href: "/calendar", label: "Agenda", icon: Calendar },
];

const MORE: Item[] = [
  { href: "/notes", label: "Notas", icon: GraduationCap },
  { href: "/mindmaps", label: "Mapas mentais", icon: Network },
  { href: "/lousa", label: "Lousa", icon: PencilRuler },
  { href: "/activities", label: "Atividades", icon: ClipboardList },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reviews", label: "Revisões", icon: Repeat },
  { href: "/stats", label: "Estatísticas", icon: BarChart3 },
  { href: "/trash", label: "Lixeira", icon: Trash2 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/subjects")
    return pathname.startsWith("/subjects") || pathname.startsWith("/subject");
  if (href === "/mindmaps")
    return pathname.startsWith("/mindmaps") || pathname.startsWith("/mindmap");
  if (href === "/activities")
    return pathname.startsWith("/activities") || pathname.startsWith("/activity");
  return pathname.startsWith(href);
}

export function MobileNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [moreOpen, setMoreOpen] = React.useState(false);

  // fecha o "Mais" ao navegar
  React.useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreActive = MORE.some((i) => isActive(pathname, i.href));

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 space-y-1 rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-card)] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-sm font-semibold">Mais</span>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setMoreOpen(false)}
                className="text-[var(--color-muted-foreground)]"
              >
                <X className="size-5" />
              </button>
            </div>
            {MORE.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive(pathname, href)
                    ? "bg-[var(--color-primary)]/12 font-medium text-[var(--color-primary)]"
                    : "hover:bg-[var(--color-accent)]"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
            >
              <LogOut className="size-4" />
              <span className="min-w-0 flex-1 truncate">
                Sair{user?.email ? ` · ${user.email}` : ""}
              </span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--color-border)] bg-[var(--color-card)] pb-[env(safe-area-inset-bottom)] md:hidden">
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)]"
              )}
            >
              <Icon className={cn("size-5", active && "scale-110")} />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            moreActive || moreOpen
              ? "text-[var(--color-foreground)]"
              : "text-[var(--color-muted-foreground)]"
          )}
        >
          <MoreHorizontal className="size-5" />
          Mais
        </button>
      </nav>
    </>
  );
}
