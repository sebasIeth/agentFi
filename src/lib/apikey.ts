import { db } from "./db";
import { randomBytes } from "crypto";

export function generateApiKey(): string {
  return `sk-${randomBytes(24).toString("hex")}`;
}

export async function validateApiKey(authHeader: string | null): Promise<{
  valid: boolean;
  userId?: string;
  walletAddress?: string;
}> {
  if (!authHeader?.startsWith("Bearer ")) return { valid: false };
  const key = authHeader.slice(7);
  if (!key.startsWith("sk-")) return { valid: false };

  const user = await db.user.findFirst({ where: { apiKey: key } });
  if (!user) return { valid: false };

  return { valid: true, userId: user.id, walletAddress: user.walletAddress };
}
