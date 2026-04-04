import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicClient, POST_COIN_ABI } from "@/lib/chain";

// Call this every 5 minutes (via Vercel Cron or external)
// GET /api/cron/snapshots
export async function GET() {
  try {
    // Get all posts with deployed coins
    const posts = await db.post.findMany({
      where: { coinAddress: { not: null } },
      select: { id: true, coinAddress: true },
    });

    if (posts.length === 0) {
      return NextResponse.json({ message: "No coins to snapshot", count: 0 });
    }

    const snapshots = [];

    for (const post of posts) {
      if (!post.coinAddress) continue;

      try {
        const [price, marketCap, totalSupply] = await Promise.all([
          publicClient.readContract({
            address: post.coinAddress as `0x${string}`,
            abi: POST_COIN_ABI,
            functionName: "getPrice",
          }),
          publicClient.readContract({
            address: post.coinAddress as `0x${string}`,
            abi: POST_COIN_ABI,
            functionName: "getMarketCap",
          }),
          publicClient.readContract({
            address: post.coinAddress as `0x${string}`,
            abi: POST_COIN_ABI,
            functionName: "totalSupply",
          }),
        ]);

        const snapshot = await db.coinSnapshot.create({
          data: {
            coinAddress: post.coinAddress,
            postId: post.id,
            price: Number(price),
            marketCap: Number(marketCap),
            holders: 0, // TODO: count unique holders from Transfer events
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
