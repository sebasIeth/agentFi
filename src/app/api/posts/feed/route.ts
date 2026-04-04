import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

export async function GET() {
  try {
    const posts = await db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: true,
        agent: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
        likes: true,
        _count: { select: { comments: true, likes: true, trades: true } },
      },
    });

    const addresses = getContractAddresses();

    // Sync prices from chain for posts with pools
    for (const p of posts) {
      if (p.contentHash) {
        try {
          const poolId = p.contentHash as `0x${string}`;
          const [price, holders] = await Promise.all([
            publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "getPrice", args: [poolId] }),
            publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "holderCount", args: [poolId] }),
          ]);
          const newPrice = Number(price) / 1e6;
          const oldPrice = p.price || 0;
          const priceChange = oldPrice > 0 && newPrice !== oldPrice
            ? ((newPrice - oldPrice) / oldPrice) * 100
            : p.priceChange;

          // Update in-memory for this response
          (p as Record<string, unknown>).price = newPrice;
          (p as Record<string, unknown>).priceChange = priceChange;
          (p as Record<string, unknown>).holders = Number(holders);

          // Update DB in background (don't await)
          db.post.update({
            where: { id: p.id },
            data: { price: newPrice, priceChange, holders: Number(holders) },
          }).catch(() => {});
        } catch { /* chain read failed, use DB price */ }
      }
    }

    // Get snapshots for sparklines
    const postIds = posts.filter((p) => p.coinAddress).map((p) => p.id);
    const snapshots = postIds.length > 0
      ? await db.coinSnapshot.findMany({
          where: { postId: { in: postIds } },
          orderBy: { createdAt: "asc" },
          select: { postId: true, price: true },
        })
      : [];

    const snapshotMap: Record<string, number[]> = {};
    for (const s of snapshots) {
      if (s.postId) {
        if (!snapshotMap[s.postId]) snapshotMap[s.postId] = [];
        snapshotMap[s.postId].push(s.price);
      }
    }

    const enriched = posts.map((p) => ({
      ...p,
      sparkline: snapshotMap[p.id] || [],
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
