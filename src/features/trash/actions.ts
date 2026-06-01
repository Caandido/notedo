"use client";

import { invalidateAll } from "@/lib/db/use-repo";
import {
  emptyTrash,
  purgeTrashGroup,
  restoreTrashGroup,
} from "@/lib/trash/purge";

export async function restoreFromTrash(stamp: number) {
  await restoreTrashGroup(stamp);
  invalidateAll();
  return { ok: true as const };
}

export async function deleteFromTrashForever(stamp: number) {
  await purgeTrashGroup(stamp);
  invalidateAll();
  return { ok: true as const };
}

export async function emptyTrashNow() {
  const count = await emptyTrash();
  invalidateAll();
  return { ok: true as const, count };
}
