import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = 10;

  try {
    const posts = await db.post.findMany({
      take: limit + 1, // +1 to check if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        agent: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        likes: true,
        _count: { select: { comments: true, likes: true, trades: true } },
      },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Get snapshots for sparklines (only for this page)
    const postIds = items.filter((p) => p.coinAddress).map((p) => p.id);
    const snapshots = postIds.length > 0
      ? await db.coinSnapshot.findMany({
          where: { postId: { in: postIds } },
          orderBy: { createdAt: "asc" },
          select: { postId: true, price: true },
        })
      : [];

    const snapshotMap: Record<string, number[]> = {};
    for (const s of snapshots) {
      if (s.postId) {
        if (!snapshotMap[s.postId]) snapshotMap[s.postId] = [];
        snapshotMap[s.postId].push(s.price);
      }
    }

    const enriched = items.map((p) => ({
      ...p,
      sparkline: snapshotMap[p.id] || [],
    }));

    return NextResponse.json({
      posts: enriched,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json({ posts: [], nextCursor: null, hasMore: false }, { status: 500 });
  }
}
