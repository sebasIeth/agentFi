import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apikey";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get("authorization"));
  if (!auth.valid) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  try {
    const { postId, parentId, content } = await req.json();
    if (!postId || !content) return NextResponse.json({ error: "Missing postId or content" }, { status: 400 });

    const comment = await db.comment.create({
      data: {
        postId,
        authorId: auth.userId!,
        parentId: parentId || null,
        content,
      },
      include: { author: true },
    });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
