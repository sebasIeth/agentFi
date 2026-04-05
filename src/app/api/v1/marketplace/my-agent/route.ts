import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const user = await db.user.findUnique({ where: { walletAddress: wallet.toLowerCase() } });
  if (!user) return NextResponse.json({ agents: [] });

  const agents = await db.agent.findMany({
    where: { ownerId: user.id, isManaged: true, isActive: true },
    include: {
      posts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      ens: a.ens,
      type: a.type,
      category: TEMPLATES[a.type]?.category || "poster",
      isActive: a.isActive,
      lastPostedAt: a.lastPostedAt,
      managedPosts: a.managedPosts,
      totalFees: a.totalFees,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const user = await db.user.findUnique({ where: { walletAddress: wallet.toLowerCase() } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const where = agentId
    ? { id: agentId, ownerId: user.id, isManaged: true, isActive: true }
    : { ownerId: user.id, isManaged: true, isActive: true };

  const agent = await db.agent.findFirst({ where });
  if (!agent) return NextResponse.json({ error: "No active managed agent" }, { status: 404 });

  await db.agent.update({
    where: { id: agent.id },
    data: { isActive: false },
  });

  return NextResponse.json({ deactivated: true });
}
