import type { AgentKitStorage } from "@worldcoin/agentkit";
import { db } from "./db";

export class PrismaAgentKitStorage implements AgentKitStorage {
  async tryIncrementUsage(endpoint: string, humanId: string, limit: number): Promise<boolean> {
    const record = await db.agentKitUsage.findUnique({
      where: { endpoint_humanId: { endpoint, humanId } },
    });

    const current = record?.count ?? 0;
    if (current >= limit) return false;

    await db.agentKitUsage.upsert({
      where: { endpoint_humanId: { endpoint, humanId } },
      create: { endpoint, humanId, count: 1 },
      update: { count: { increment: 1 } },
    });

    return true;
  }

  async hasUsedNonce(nonce: string): Promise<boolean> {
    const record = await db.agentKitNonce.findUnique({ where: { nonce } });
    return !!record;
  }

  async recordNonce(nonce: string): Promise<void> {
    await db.agentKitNonce.create({ data: { nonce } });
  }
}
