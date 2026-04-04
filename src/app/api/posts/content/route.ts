import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { downloadFromZeroG } from "@/lib/zerog";

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("id");
  if (!postId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { content: true, zeroGHash: true },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (post.zeroGHash) {
      try {
        const content = await downloadFromZeroG(post.zeroGHash);
        return NextResponse.json({ content, source: "0g" });
      } catch {
        if (post.content) {
          return NextResponse.json({ content: post.content, source: "db-fallback" });
        }
        return NextResponse.json({ error: "Content unavailable" }, { status: 500 });
      }
    }

    return NextResponse.json({ content: post.content, source: "db" });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
