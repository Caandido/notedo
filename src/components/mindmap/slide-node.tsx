"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ImageOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { ensureBlob } from "@/lib/sync/storage";

export type SlideNodeData = {
  slide: { path: string; w: number; h: number } | null;
};

export function SlideNode({ data, selected }: NodeProps) {
  const path = (data as SlideNodeData).slide?.path;
  const [url, setUrl] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!path) {
      setFailed(true);
      return;
    }
    let active = true;
    let obj: string | null = null;
    setFailed(false);
    setUrl(null);
    void ensureBlob(path).then((blob) => {
      if (!active) return;
      if (blob) {
        obj = URL.createObjectURL(blob);
        setUrl(obj);
      } else {
        setFailed(true);
      }
    });
    return () => {
      active = false;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [path]);

  return (
    <div
      className={cn(
        "size-full overflow-hidden rounded-lg border bg-white shadow-sm",
        selected ? "border-[var(--color-ring)]" : "border-[var(--color-border)]"
      )}
    >
      <Handle type="target" position={Position.Top} className="!size-2" />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Slide importado"
          className="size-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-[var(--color-secondary)] text-[var(--color-muted-foreground)]">
          {failed ? (
            <ImageOff className="size-6" />
          ) : (
            <Loader2 className="size-6 animate-spin" />
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!size-2" />
    </div>
  );
}
