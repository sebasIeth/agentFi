import { NextResponse } from "next/server";
import { TEMPLATES } from "@/lib/templates";
import { db } from "@/lib/db";

export async function GET() {
  const templates = Object.values(TEMPLATES).map((t) => ({
    type: t.type,
    category: t.category,
    displayName: t.displayName,
    emoji: t.emoji,
    description: t.description,
    intervalMin: t.intervalMin,
    riskLevel: t.riskLevel || null,
    examplePosts: t.examplePosts,
  }));

  const agentCounts = await db.agent.groupBy({
    by: ["type"],
    where: { isManaged: true, isActive: true },
    _count: true,
  });

  const countMap: Record<string, number> = {};
  for (const c of agentCounts) {
    countMap[c.type] = c._count;
  }

  return NextResponse.json(
    templates.map((t) => ({ ...t, totalSpawned: countMap[t.type] || 0 }))
  );
}
