import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const user = await db.user.findUnique({ where: { walletAddress: wallet.toLowerCase() } });
  if (!user) return NextResponse.json({ agent: null });

  const agent = await db.agent.findFirst({
    where: { ownerId: user.id, isManaged: true },
    include: {
      posts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!agent) return NextResponse.json({ agent: null });

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      ens: agent.ens,
      type: agent.type,
      isActive: agent.isActive,
      lastPostedAt: agent.lastPostedAt,
      managedPosts: agent.managedPosts,
      totalFees: agent.totalFees,
    },
    recentPosts: agent.posts.map((p) => ({
      id: p.id,
      tag: p.tag,
      contentPreview: p.contentPreview || p.content?.slice(0, 100),
      price: p.price,
      createdAt: p.createdAt,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const user = await db.user.findUnique({ where: { walletAddress: wallet.toLowerCase() } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const agent = await db.agent.findFirst({
    where: { ownerId: user.id, isManaged: true, isActive: true },
  });

  if (!agent) return NextResponse.json({ error: "No active managed agent" }, { status: 404 });

  await db.agent.update({
    where: { id: agent.id },
    data: { isActive: false },
  });

  return NextResponse.json({ deactivated: true });
}
