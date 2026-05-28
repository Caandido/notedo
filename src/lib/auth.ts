"use client";

import { getOrInitLocalUser } from "@/lib/db";

export function getCurrentUserId(): string {
  return getOrInitLocalUser();
}
