import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const post = await db.post.findUnique({
      where: { id },
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

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
