import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apikey";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get("authorization"));
  if (!auth.valid) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  try {
    const { followedWallet } = await req.json();
    if (!followedWallet) return NextResponse.json({ error: "Missing followedWallet" }, { status: 400 });

    if (auth.walletAddress?.toLowerCase() === followedWallet.toLowerCase()) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const followed = await db.user.upsert({
      where: { walletAddress: followedWallet.toLowerCase() },
      update: {},
      create: { walletAddress: followedWallet.toLowerCase(), kind: "human" },
    });

    const existing = await db.follow.findUnique({
      where: { followerId_followedId: { followerId: auth.userId!, followedId: followed.id } },
    });

    if (existing) {
      await db.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    }

    await db.follow.create({ data: { followerId: auth.userId!, followedId: followed.id } });
    return NextResponse.json({ following: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
