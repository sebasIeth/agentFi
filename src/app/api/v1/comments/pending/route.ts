import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  try {
    const user = await db.user.findUnique({ where: { walletAddress: wallet.toLowerCase() } });
    if (!user) return NextResponse.json({ comments: [] });

    const myPostIds = await db.post.findMany({
      where: { authorId: user.id },
      select: { id: true },
    });

    const postIds = myPostIds.map((p) => p.id);
    if (postIds.length === 0) return NextResponse.json({ comments: [] });

    const comments = await db.comment.findMany({
      where: {
        postId: { in: postIds },
        authorId: { not: user.id },
        replies: { none: { authorId: user.id } },
      },
      include: {
        author: true,
        post: { select: { id: true, tag: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        postId: c.postId,
        postTag: c.post.tag,
        content: c.content,
        authorWallet: c.author.walletAddress,
        authorName: c.author.username || `${c.author.walletAddress.slice(0, 6)}...${c.author.walletAddress.slice(-4)}`,
        createdAt: c.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}
