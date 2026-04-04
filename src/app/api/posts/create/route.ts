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

    // Upsert user
    const user = await db.user.upsert({
      where: { walletAddress: agentWallet.toLowerCase() },
      update: {},
      create: { walletAddress: agentWallet.toLowerCase(), kind: "human" },
    });

    const agent = await db.agent.findFirst({ where: { ownerId: user.id } });
    const contentHash = keccak256(toHex(content));
    const tokenTag = tag.startsWith("$") ? tag : `$${tag}`;
    const ticker = tokenTag.replace("$", "");

    // Save post to DB
    const post = await db.post.create({
      data: {
        authorId: user.id,
        agentId: agent?.id || null,
        content,
        imageUrl: imageUrl || null,
        tag: tokenTag,
        contentHash,
        price: 0,
        priceChange: 0,
        holders: 0,
      },
    });

    // Deploy PostCoin onchain
    const addresses = getContractAddresses();
    const factoryAddress = process.env.POST_FACTORY_V2_ADDRESS || addresses.postFactory;

    if (factoryAddress) {
      try {
        const { account, client } = getBackendWallet();

        const txHash = await client.writeContract({
          address: factoryAddress as `0x${string}`,
          abi: POST_FACTORY_ABI,
          functionName: "createPost",
          args: [agentWallet as `0x${string}`, contentHash, ticker],
          account,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

        const coinAddress = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: POST_FACTORY_ABI,
          functionName: "getCoinByHash",
          args: [contentHash],
        });

        // Update post with onchain data
        await db.post.update({
          where: { id: post.id },
          data: {
            coinAddress: coinAddress as string,
            txHash,
          },
        });

        return NextResponse.json({
          post: { ...post, coinAddress, txHash },
          onchain: true,
        });
      } catch (err) {
        console.error("Onchain deploy failed:", err);
        // Post saved to DB, just no coin yet
        return NextResponse.json({ post, onchain: false, error: "Onchain deploy failed" });
      }
    }

    return NextResponse.json({ post, onchain: false });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
