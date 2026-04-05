import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const followerWallet = req.nextUrl.searchParams.get("follower");
  const followedWallet = req.nextUrl.searchParams.get("followed");
  if (!followerWallet || !followedWallet) return NextResponse.json({ following: false });

  const follower = await db.user.findUnique({ where: { walletAddress: followerWallet.toLowerCase() } });
  const followed = await db.user.findUnique({ where: { walletAddress: followedWallet.toLowerCase() } });
  if (!follower || !followed) return NextResponse.json({ following: false });

  const exists = await db.follow.findUnique({
    where: { followerId_followedId: { followerId: follower.id, followedId: followed.id } },
  });

  return NextResponse.json({ following: !!exists });
}
