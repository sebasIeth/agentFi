import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

// Call this every 5 minutes (via Vercel Cron or external)
// GET /api/cron/snapshots
export async function GET() {
  try {
    const { vault: vaultAddress } = getContractAddresses();

    // Get all posts with a contentHash (required for Vault lookups)
    const posts = await db.post.findMany({
      where: { contentHash: { not: null }, coinAddress: { not: null } },
      select: { id: true, coinAddress: true, contentHash: true },
    });

    if (posts.length === 0) {
      return NextResponse.json({ message: "No coins to snapshot", count: 0 });
    }

    const snapshots = [];

    for (const post of posts) {
      if (!post.coinAddress || !post.contentHash) continue;

      try {
        const postId = post.contentHash as `0x${string}`;

        const [price, marketCap, holderCount] = await Promise.all([
          publicClient.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: "getPrice",
            args: [postId],
          }),
          publicClient.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: "getMarketCap",
            args: [postId],
          }),
          publicClient.readContract({
            address: vaultAddress,
            abi: VAULT_ABI,
            functionName: "holderCount",
            args: [postId],
          }),
        ]);

        const snapshot = await db.coinSnapshot.create({
          data: {
            coinAddress: post.coinAddress,
            postId: post.id,
            price: Number(price),
            marketCap: Number(marketCap),
            holders: Number(holderCount),
          },
        });

        // Update post price
        await db.post.update({
          where: { id: post.id },
          data: { price: Number(price) },
        });

        snapshots.push(snapshot);
      } catch (err) {
        console.error(`Snapshot failed for ${post.coinAddress}:`, err);
      }
    }

    return NextResponse.json({ message: "Snapshots taken", count: snapshots.length });
  } catch (error) {
    console.error("Snapshot cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
