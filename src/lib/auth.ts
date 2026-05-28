import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@notedo.app";

let cachedUserId: string | null = null;

export async function getCurrentUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, name: "Usuário Demo" },
  });

  cachedUserId = user.id;
  return user.id;
}
