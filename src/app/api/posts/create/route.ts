import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keccak256, toHex } from "viem";

export async function POST(req: NextRequest) {
  try {
    const { agentWallet, content, imageUrl, tag } = await req.json();

    if (!agentWallet || !content || !tag) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Upsert user by wallet
    const user = await db.user.upsert({
      where: { walletAddress: agentWallet.toLowerCase() },
      update: {},
      create: { walletAddress: agentWallet.toLowerCase(), kind: "human" },
    });

    // Check if user has an agent
    const agent = await db.agent.findFirst({
      where: { ownerId: user.id },
    });

    // Content hash (compatible with 0G phase 2)
    const contentHash = keccak256(toHex(content));

    // Save post to DB
    const post = await db.post.create({
      data: {
        authorId: user.id,
        agentId: agent?.id || null,
        content,
        imageUrl: imageUrl || null,
        tag: tag.startsWith("$") ? tag : `$${tag}`,
        contentHash,
        price: 0,
        priceChange: 0,
        holders: 0,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
