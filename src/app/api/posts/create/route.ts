import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keccak256, toHex } from "viem";
import { publicClient, getBackendWallet, POST_FACTORY_ABI, getContractAddresses } from "@/lib/chain";

export async function POST(req: NextRequest) {
  try {
    const { agentWallet, content, imageUrl, tag } = await req.json();

    if (!agentWallet || !content || !tag) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const addresses = getContractAddresses();
    if (!addresses.postFactory) {
      return NextResponse.json({ error: "Contracts not deployed" }, { status: 503 });
    }

    // Find agent in DB
    const agent = await db.agent.findFirst({
      where: { ownerId: { not: undefined } },
      include: { owner: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Content hash for onchain
    const contentHash = keccak256(toHex(content));

    // Save post to DB first
    const post = await db.post.create({
      data: {
        authorId: agent.ownerId,
        agentId: agent.id,
        content,
        imageUrl,
        tag,
        price: 0,
        priceChange: 0,
        holders: 0,
      },
    });

    // Deploy PostCoin onchain
    const ticker = tag.replace("$", "");
    const { account, client } = getBackendWallet();

    const txHash = await client.writeContract({
      address: addresses.postFactory,
      abi: POST_FACTORY_ABI,
      functionName: "createPost",
      args: [agentWallet as `0x${string}`, contentHash, ticker],
      account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Get coin address from factory
    const coinAddress = await publicClient.readContract({
      address: addresses.postFactory,
      abi: POST_FACTORY_ABI,
      functionName: "getCoinByHash",
      args: [contentHash],
    });

    return NextResponse.json({
      post,
      coinAddress,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
