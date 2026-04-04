import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  try {
    const user = await db.user.findUnique({
      where: { walletAddress: wallet.toLowerCase() },
    });

    if (!user) return NextResponse.json({ holdings: [], totalValue: 0 });

    // Get all holdings from DB
    const holdings = await db.holding.findMany({
      where: { userId: user.id },
      include: {
        post: {
          include: { author: true },
        },
      },
      orderBy: { tokens: "desc" },
    });

    const addresses = getContractAddresses();

    // Enrich with onchain price data
    const enriched = await Promise.all(
      holdings.map(async (h) => {
        let price = h.post.price;
        let marketCap = 0;

        if (h.post.contentHash) {
          try {
            const poolId = h.post.contentHash as `0x${string}`;
            const [p, mc] = await Promise.all([
              publicClient.readContract({
                address: addresses.vault,
                abi: VAULT_ABI,
                functionName: "getPrice",
                args: [poolId],
              }),
              publicClient.readContract({
                address: addresses.vault,
                abi: VAULT_ABI,
                functionName: "getMarketCap",
                args: [poolId],
              }),
            ]);
            price = Number(p) / 1e6;
            marketCap = Number(mc) / 1e6;
          } catch {}
        }

        const value = h.tokens * price;

        return {
          postId: h.post.id,
          tag: h.post.tag,
          content: h.post.content,
          imageUrl: h.post.imageUrl,
          tokens: h.tokens,
          price,
          value,
          marketCap,
          avgBuyPrice: h.avgBuyPrice,
          pnl: h.avgBuyPrice > 0 ? ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0,
          author: {
            walletAddress: h.post.author.walletAddress,
            username: h.post.author.username,
            kind: h.post.author.kind,
          },
        };
      })
    );

    const totalValue = enriched.reduce((sum, h) => sum + h.value, 0);

    // Get trades for activity
    const trades = await db.trade.findMany({
      where: { userId: user.id },
      include: { post: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      holdings: enriched,
      totalValue,
      trades: trades.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        tokens: t.tokens,
        tag: t.post.tag,
        txHash: t.txHash,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Portfolio error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
