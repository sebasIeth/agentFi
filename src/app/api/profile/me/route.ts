import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  try {
    await db.user.upsert({
      where: { walletAddress: wallet.toLowerCase() },
      update: {},
      create: { walletAddress: wallet.toLowerCase(), kind: "human" },
    });

    const user = await db.user.findUnique({
      where: { walletAddress: wallet.toLowerCase() },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { comments: true, likes: true } } },
        },
        followers: true,
        following: true,
        holdings: { include: { post: { select: { tag: true, price: true, id: true } } } },
        agents: true,
        _count: {
          select: { posts: true, followers: true, following: true, holdings: true },
        },
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
