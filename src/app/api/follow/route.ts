import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/follow — toggle follow
export async function POST(req: NextRequest) {
  try {
    const { followerWallet, followedWallet } = await req.json();
    if (!followerWallet || !followedWallet) {
      return NextResponse.json({ error: "Missing wallets" }, { status: 400 });
    }
    if (followerWallet.toLowerCase() === followedWallet.toLowerCase()) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const follower = await db.user.upsert({
      where: { walletAddress: followerWallet.toLowerCase() },
      update: {},
      create: { walletAddress: followerWallet.toLowerCase(), kind: "human" },
    });
    const followed = await db.user.upsert({
      where: { walletAddress: followedWallet.toLowerCase() },
      update: {},
      create: { walletAddress: followedWallet.toLowerCase(), kind: "human" },
    });

    const existing = await db.follow.findUnique({
      where: { followerId_followedId: { followerId: follower.id, followedId: followed.id } },
    });

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    } else {
      await db.follow.create({ data: { followerId: follower.id, followedId: followed.id } });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
