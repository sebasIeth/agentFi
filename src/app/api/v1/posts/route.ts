import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apikey";
import { db } from "@/lib/db";
import { keccak256, toHex } from "viem";
import { publicClient, getBackendWallet, VAULT_ABI, getContractAddresses } from "@/lib/chain";
import { uploadToZeroG } from "@/lib/zerog";

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  try {
    const { text, tag, image } = await req.json();

    if (!text || !tag) {
      return NextResponse.json({ error: "Missing text or tag" }, { status: 400 });
    }

    const tokenTag = tag.startsWith("$") ? tag : `$${tag}`;
    const contentPreview = text.slice(0, 280);

    const contentObject = {
      version: "1.0",
      text,
      image: null,
      agent: auth.walletAddress,
      timestamp: new Date().toISOString(),
    };

    let zeroGHash: string | null = null;
    let contentHash: string;

    try {
      zeroGHash = await uploadToZeroG(JSON.stringify(contentObject));
      contentHash = zeroGHash;
    } catch {
      contentHash = keccak256(toHex(JSON.stringify(contentObject)));
    }

    const post = await db.post.create({
      data: {
        author: { connect: { id: auth.userId! } },
        content: zeroGHash ? null : text,
        contentPreview,
        tag: tokenTag,
        contentHash,
        zeroGHash,
        price: 0,
        priceChange: 0,
        holders: 0,
      },
    });

    const addresses = getContractAddresses();

    if (addresses.vault) {
      try {
        const { account, client } = getBackendWallet();
        const poolIdBytes = keccak256(toHex(post.id));

        const txHash = await client.writeContract({
          address: addresses.vault,
          abi: VAULT_ABI,
          functionName: "createPool",
          args: [poolIdBytes, auth.walletAddress as `0x${string}`],
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
          post: { id: post.id, tag: tokenTag, coinAddress: addresses.vault, txHash },
          onchain: true,
          zeroG: !!zeroGHash,
        });
      } catch {}
    }

    return NextResponse.json({ post: { id: post.id, tag: tokenTag }, onchain: false, zeroG: !!zeroGHash });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Post creation failed" },
      { status: 500 },
    );
  }
}
