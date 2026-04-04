import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

// GET /api/cron/snapshots
// Only syncs posts with recent activity (last 24h trades)
export async function GET() {
  try {
    const { vault: vaultAddress } = getContractAddresses();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get posts that had trades recently OR were created recently
    const posts = await db.post.findMany({
      where: {
        contentHash: { not: null },
        OR: [
          { trades: { some: { createdAt: { gte: oneDayAgo } } } },
          { createdAt: { gte: oneDayAgo } },
        ],
      },
      select: { id: true, coinAddress: true, contentHash: true, price: true },
    });

    if (posts.length === 0) {
      return NextResponse.json({ message: "No active coins", count: 0 });
    }

    let count = 0;

    for (const post of posts) {
      if (!post.contentHash) continue;

      try {
        const poolId = post.contentHash as `0x${string}`;
        const [price, marketCap, holderCount] = await Promise.all([
          publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "getPrice", args: [poolId] }),
          publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "getMarketCap", args: [poolId] }),
          publicClient.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: "holderCount", args: [poolId] }),
        ]);

        const newPrice = Number(price) / 1e6;
        const oldPrice = post.price || 0;
        const priceChange = oldPrice > 0 && newPrice !== oldPrice
          ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;

        await db.coinSnapshot.create({
          data: {
            coinAddress: post.coinAddress || vaultAddress,
            postId: post.id,
            price: newPrice,
            marketCap: Number(marketCap) / 1e6,
            holders: Number(holderCount),
          },
        });

        await db.post.update({
          where: { id: post.id },
          data: { price: newPrice, priceChange, holders: Number(holderCount) },
        });

        count++;
      } catch (err) {
        console.error(`Snapshot failed for ${post.id}:`, err);
      }
    }

    return NextResponse.json({ message: "Snapshots taken", count });
  } catch (error) {
    console.error("Snapshot cron error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
