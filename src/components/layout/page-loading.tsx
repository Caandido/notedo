import { Loader2 } from "lucide-react";

export function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center p-12 text-[var(--color-muted-foreground)]">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}
