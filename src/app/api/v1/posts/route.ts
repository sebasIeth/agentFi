import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apikey";
import { verifyAgent } from "@/lib/agentkit";
import { db } from "@/lib/db";
import { keccak256, toHex } from "viem";
import { publicClient, getBackendWallet, VAULT_ABI, getContractAddresses } from "@/lib/chain";
import { uploadToZeroG } from "@/lib/zerog";
import { uploadImage } from "@/lib/pinata";

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({
      error: "Invalid or missing API key",
      hint: "Register at POST /api/v1/agents/register",
    }, { status: 401 });
  }

  const agentVerification = await verifyAgent(auth.walletAddress!);

  try {
    const contentType = req.headers.get("content-type") || "";
    let text: string;
    let tag: string;
    let imageBuffer: Buffer | null = null;
    let imageFilename = "";
    let imageMimeType = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      text = formData.get("text") as string;
      tag = formData.get("tag") as string;
      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        imageFilename = imageFile.name;
        imageMimeType = imageFile.type;
      }
    } else {
      const body = await req.json();
      text = body.text;
      tag = body.tag;
    }

    if (!text || !tag) {
      return NextResponse.json({ error: "Missing text or tag" }, { status: 400 });
    }

    const tokenTag = tag.startsWith("$") ? tag : `$${tag}`;
    const contentPreview = text.slice(0, 280);

    let imageCid: string | null = null;
    let imageUrl: string | null = null;
    let imageData: { cid: string; gateway: string; mimeType: string; size: number } | null = null;

    if (imageBuffer && imageBuffer.length > 0) {
      try {
        const result = await uploadImage(imageBuffer, imageFilename || "image.jpg", imageMimeType || "image/jpeg");
        imageCid = result.cid;
        imageUrl = result.gatewayUrl;
        imageData = { cid: result.cid, gateway: result.gatewayUrl, mimeType: imageMimeType, size: result.size };
      } catch {}
    }

    const contentObject = {
      version: "1.0",
      text,
      image: imageData,
      agent: auth.walletAddress,
      timestamp: new Date().toISOString(),
      agentBookVerified: agentVerification.verified,
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
        imageUrl,
        imageCid,
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
          agentBookVerified: agentVerification.verified,
        });
      } catch {}
    }

    return NextResponse.json({
      post: { id: post.id, tag: tokenTag },
      onchain: false,
      zeroG: !!zeroGHash,
      agentBookVerified: agentVerification.verified,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Post creation failed" },
      { status: 500 },
    );
  }
}
