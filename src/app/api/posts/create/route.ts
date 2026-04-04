import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keccak256, toHex } from "viem";
import { publicClient, getBackendWallet, VAULT_ABI, getContractAddresses } from "@/lib/chain";
import { uploadToZeroG } from "@/lib/zerog";

export async function POST(req: NextRequest) {
  try {
    const { agentWallet, content, imageUrl, tag } = await req.json();

    if (!agentWallet || !content || !tag) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (agentWallet && !/^0x[a-fA-F0-9]{40}$/.test(agentWallet)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const user = await db.user.upsert({
      where: { walletAddress: agentWallet.toLowerCase() },
      update: {},
      create: { walletAddress: agentWallet.toLowerCase(), kind: "human" },
    });

    const agent = await db.agent.findFirst({ where: { ownerId: user.id } });
    const tokenTag = tag.startsWith("$") ? tag : `$${tag}`;
    const contentPreview = content.slice(0, 280);

    let zeroGHash: string | null = null;
    let contentHash: string;

    try {
      zeroGHash = await uploadToZeroG(content);
      contentHash = zeroGHash;
    } catch {
      contentHash = keccak256(toHex(content));
    }

    const post = await db.post.create({
      data: {
        authorId: user.id,
        agentId: agent?.id || null,
        content: zeroGHash ? null : content,
        contentPreview,
        imageUrl: imageUrl || null,
        tag: tokenTag,
        contentHash,
        zeroGHash,
        price: 0,
        priceChange: 0,
        holders: 0,
      },
    });

    const addresses = getContractAddresses();
    const factoryAddress = process.env.POST_FACTORY_V2_ADDRESS || addresses.postFactory;

    if (addresses.vault) {
      try {
        const { account, client } = getBackendWallet();
        const poolIdBytes = keccak256(toHex(post.id));

        const txHash = await client.writeContract({
          address: addresses.vault,
          abi: VAULT_ABI,
          functionName: "createPool",
          args: [poolIdBytes, agentWallet as `0x${string}`],
          account,
        });

        await publicClient.waitForTransactionReceipt({ hash: txHash });

        const price = await publicClient.readContract({
          address: addresses.vault,
          abi: VAULT_ABI,
          functionName: "getPrice",
          args: [poolIdBytes],
        });

        await db.post.update({
          where: { id: post.id },
          data: {
            coinAddress: addresses.vault,
            contentHash: poolIdBytes,
            txHash,
            price: Number(price) / 1e6,
            holders: 1,
          },
        });

        return NextResponse.json({
          post: { ...post, txHash, coinAddress: addresses.vault },
          onchain: true,
          zeroG: !!zeroGHash,
          poolId: poolIdBytes,
        });
      } catch {}
    }

    return NextResponse.json({ post, onchain: false, zeroG: !!zeroGHash });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
