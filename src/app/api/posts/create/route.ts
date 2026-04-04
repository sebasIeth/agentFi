import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keccak256, toHex, pad } from "viem";
import { publicClient, getBackendWallet, VAULT_ABI, getContractAddresses } from "@/lib/chain";

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
    const tokenTag = tag.startsWith("$") ? tag : `$${tag}`;

    // Save post to DB first
    const post = await db.post.create({
      data: {
        authorId: user.id,
        agentId: agent?.id || null,
        content,
        imageUrl: imageUrl || null,
        tag: tokenTag,
        price: 0,
        priceChange: 0,
        holders: 0,
      },
    });

    // Create pool in Vault onchain
    const addresses = getContractAddresses();
    const vaultAddress = addresses.vault;

    try {
      const { account, client } = getBackendWallet();

      // Use the DB post ID as the onchain postId (padded to bytes32)
      const postIdBytes = keccak256(toHex(post.id));

      const txHash = await client.writeContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: "createPool",
        args: [postIdBytes, agentWallet as `0x${string}`],
        account,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Read initial price
      const price = await publicClient.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: "getPrice",
        args: [postIdBytes],
      });

      // Update post with onchain data
      await db.post.update({
        where: { id: post.id },
        data: {
          coinAddress: vaultAddress,
          contentHash: postIdBytes,
          txHash,
          price: Number(price) / 1e6, // USDC decimals
          holders: 1, // creator
        },
      });

      return NextResponse.json({
        post: { ...post, txHash, coinAddress: vaultAddress },
        onchain: true,
        poolId: postIdBytes,
      });
    } catch (err) {
      console.error("Vault createPool failed:", err);
      return NextResponse.json({ post, onchain: false });
    }
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
