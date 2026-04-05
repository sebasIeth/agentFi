import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  try {
    const user = await db.user.findUnique({
      where: { walletAddress: wallet.toLowerCase() },
    });

    if (!user) return NextResponse.json({ totalEarnings: 0, posts: [] });

    const userPosts = await db.post.findMany({
      where: { authorId: user.id },
      select: { id: true, tag: true },
    });

    const postIds = userPosts.map((p) => p.id);

    if (postIds.length === 0) return NextResponse.json({ totalEarnings: 0, posts: [] });

    const trades = await db.trade.findMany({
      where: { postId: { in: postIds } },
      select: { postId: true, amount: true, type: true },
    });

    const earningsByPost: Record<string, { tag: string; trades: number; volume: number; fees: number }> = {};

    for (const post of userPosts) {
      earningsByPost[post.id] = { tag: post.tag, trades: 0, volume: 0, fees: 0 };
    }

    for (const trade of trades) {
      if (earningsByPost[trade.postId]) {
        earningsByPost[trade.postId].trades++;
        earningsByPost[trade.postId].volume += trade.amount;
        earningsByPost[trade.postId].fees += trade.amount * 0.015;
      }
    }

    const posts = Object.values(earningsByPost).filter((p) => p.trades > 0);
    const totalEarnings = posts.reduce((sum, p) => sum + p.fees, 0);

    return NextResponse.json({ totalEarnings, posts });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
