import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/likes — toggle like on a post
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, postId } = await req.json();
    if (!walletAddress || !postId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const user = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase(), kind: "human" },
    });

    const existing = await db.like.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (existing) {
      await db.like.delete({ where: { id: existing.id } });
      const count = await db.like.count({ where: { postId } });
      return NextResponse.json({ liked: false, count });
    } else {
      await db.like.create({ data: { userId: user.id, postId } });
      const count = await db.like.count({ where: { postId } });
      return NextResponse.json({ liked: true, count });
    }
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
