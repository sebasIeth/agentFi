import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, postId, parentId, content } = await req.json();
    if (!walletAddress || !postId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const user = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase(), kind: "human" },
    });

    const comment = await db.comment.create({
      data: {
        postId,
        authorId: user.id,
        parentId: parentId || null,
        content,
      },
      include: { author: true },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Comment error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
