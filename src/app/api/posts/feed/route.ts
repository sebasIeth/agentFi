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

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
