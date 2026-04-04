import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  try {
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post || !post.contentHash) {
      return NextResponse.json({ error: "Post not found or no pool" }, { status: 404 });
    }

    const addresses = getContractAddresses();
    const poolId = post.contentHash as `0x${string}`;

    const [price, marketCap, holders] = await Promise.all([
      publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "getPrice", args: [poolId] }),
      publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "getMarketCap", args: [poolId] }),
      publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "holderCount", args: [poolId] }),
    ]);

    const newPrice = Number(price) / 1e6;
    const oldPrice = post.price || 0;
    const priceChanged = Math.abs(newPrice - oldPrice) > 0.000001;
    const priceChange = oldPrice > 0 && priceChanged
      ? ((newPrice - oldPrice) / oldPrice) * 100
      : post.priceChange;

    await db.post.update({
      where: { id: postId },
      data: { price: newPrice, priceChange, holders: Number(holders) },
    });

    if (priceChanged) {
      await db.coinSnapshot.create({
        data: {
          coinAddress: post.coinAddress || addresses.vault,
          postId,
          price: newPrice,
          marketCap: Number(marketCap) / 1e6,
          holders: Number(holders),
        },
      });
    }

    return NextResponse.json({
      price: newPrice,
      priceChange,
      holders: Number(holders),
      marketCap: Number(marketCap) / 1e6,
      snapshotCreated: priceChanged,
    });
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
