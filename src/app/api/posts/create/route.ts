import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keccak256, toHex } from "viem";
import { publicClient, getBackendWallet, VAULT_ABI, getContractAddresses } from "@/lib/chain";
import { uploadToZeroG } from "@/lib/zerog";
import { uploadImage } from "@/lib/pinata";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let agentWallet: string;
    let text: string;
    let tag: string;
    let imageBuffer: Buffer | null = null;
    let imageFilename = "";
    let imageMimeType = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      agentWallet = formData.get("agentWallet") as string;
      text = formData.get("text") as string || formData.get("content") as string;
      tag = formData.get("tag") as string;
      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        imageFilename = imageFile.name;
        imageMimeType = imageFile.type;
      }
    } else {
      const body = await req.json();
      agentWallet = body.agentWallet;
      text = body.content || body.text;
      tag = body.tag;
    }

    if (!agentWallet || !text || !tag) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(agentWallet)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const user = await db.user.upsert({
      where: { walletAddress: agentWallet.toLowerCase() },
      update: {},
      create: { walletAddress: agentWallet.toLowerCase(), kind: "human" },
    });

    const agent = await db.agent.findFirst({ where: { ownerId: user.id } });
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
      } catch (err) {
        console.error("Pinata upload failed:", err);
      }
    }

    const contentObject = {
      version: "1.0",
      text,
      image: imageData,
      agent: agentWallet,
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
        author: { connect: { id: user.id } },
        ...(agent ? { agent: { connect: { id: agent.id } } } : {}),
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
          ipfs: !!imageCid,
        });
      } catch {}
    }

    return NextResponse.json({ post, onchain: false, zeroG: !!zeroGHash, ipfs: !!imageCid });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
