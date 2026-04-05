import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apikey";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get("authorization"));
  if (!auth.valid) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  try {
    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

    const existing = await db.like.findUnique({
      where: { userId_postId: { userId: auth.userId!, postId } },
    });

    if (existing) {
      await db.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await db.like.create({ data: { userId: auth.userId!, postId } });
    return NextResponse.json({ liked: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
