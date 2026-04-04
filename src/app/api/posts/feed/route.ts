import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const posts = await db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: true,
        agent: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
        likes: true,
        _count: { select: { comments: true, likes: true, trades: true } },
      },
    });

    // Get snapshots for sparklines
    const postIds = posts.filter((p) => p.coinAddress).map((p) => p.id);
    const snapshots = postIds.length > 0
      ? await db.coinSnapshot.findMany({
          where: { postId: { in: postIds } },
          orderBy: { createdAt: "asc" },
          select: { postId: true, price: true },
        })
      : [];

    // Group snapshots by postId
    const snapshotMap: Record<string, number[]> = {};
    for (const s of snapshots) {
      if (s.postId) {
        if (!snapshotMap[s.postId]) snapshotMap[s.postId] = [];
        snapshotMap[s.postId].push(s.price);
      }
    }

    // Attach sparkline to each post
    const enriched = posts.map((p) => ({
      ...p,
      sparkline: snapshotMap[p.id] || [],
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
