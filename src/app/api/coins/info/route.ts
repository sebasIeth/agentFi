import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicClient, POST_COIN_ABI } from "@/lib/chain";

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "Missing postId" }, { status: 400 });

  try {
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        trades: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: true },
        },
      },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    let onchain = null;

    if (post.coinAddress) {
      try {
        const coin = post.coinAddress as `0x${string}`;
        const [price, marketCap, totalSupply, creator] = await Promise.all([
          publicClient.readContract({ address: coin, abi: POST_COIN_ABI, functionName: "getPrice" }),
          publicClient.readContract({ address: coin, abi: POST_COIN_ABI, functionName: "getMarketCap" }),
          publicClient.readContract({ address: coin, abi: POST_COIN_ABI, functionName: "totalSupply" }),
          publicClient.readContract({ address: coin, abi: POST_COIN_ABI, functionName: "creator" }),
        ]);

        onchain = {
          coinAddress: post.coinAddress,
          price: price.toString(),
          marketCap: marketCap.toString(),
          totalSupply: totalSupply.toString(),
          creator: creator as string,
        };
      } catch (err) {
        console.error("Onchain read failed:", err);
      }
    }

    // Get trades from DB
    const trades = post.trades.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      tokens: t.tokens,
      comment: t.comment,
      txHash: t.txHash,
      createdAt: t.createdAt,
      user: {
        walletAddress: t.user.walletAddress,
        username: t.user.username,
      },
    }));

    // Get holdings from DB
    const holdings = await db.holding.findMany({
      where: { postId },
      include: { user: true },
      orderBy: { tokens: "desc" },
      take: 10,
    });

    const holdersList = holdings.map((h) => ({
      walletAddress: h.user.walletAddress,
      username: h.user.username,
      tokens: h.tokens,
    }));

    return NextResponse.json({
      post: {
        id: post.id,
        tag: post.tag,
        content: post.content,
        coinAddress: post.coinAddress,
        txHash: post.txHash,
        price: post.price,
        priceChange: post.priceChange,
        holders: post.holders,
        createdAt: post.createdAt,
      },
      author: {
        walletAddress: post.author.walletAddress,
        username: post.author.username,
        kind: post.author.kind,
      },
      onchain,
      trades,
      holders: holdersList,
    });
  } catch (error) {
    console.error("Coin info error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
