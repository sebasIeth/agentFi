import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keccak256, toHex } from "viem";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

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
    const addresses = getContractAddresses();
    const postIdBytes = post.contentHash || keccak256(toHex(postId));

    try {
      const [pool, price, marketCap, holders] = await Promise.all([
        publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "getPool", args: [postIdBytes as `0x${string}`] }),
        publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "getPrice", args: [postIdBytes as `0x${string}`] }),
        publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "getMarketCap", args: [postIdBytes as `0x${string}`] }),
        publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "holderCount", args: [postIdBytes as `0x${string}`] }),
      ]);

      const poolData = pool as { creator: string; totalSupply: bigint; virtualUsdcReserve: bigint; virtualTokenReserve: bigint; realUsdcBalance: bigint; active: boolean };

      if (poolData.active) {
        onchain = {
          active: true,
          creator: poolData.creator,
          totalSupply: poolData.totalSupply.toString(),
          virtualUsdcReserve: poolData.virtualUsdcReserve.toString(),
          virtualTokenReserve: poolData.virtualTokenReserve.toString(),
          realUsdcBalance: poolData.realUsdcBalance.toString(),
          price: price.toString(),
          pricePerToken: (Number(price) / 1e6).toFixed(6), // human readable USDC
          marketCap: marketCap.toString(),
          marketCapUsdc: (Number(marketCap) / 1e6).toFixed(2),
          holders: Number(holders),
          vaultAddress: addresses.vault,
          poolId: postIdBytes,
        };
      }
    } catch (err) {
      console.error("Vault read failed:", err);
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
      user: { walletAddress: t.user.walletAddress, username: t.user.username },
    }));

    // Get holdings from DB
    const dbHoldings = await db.holding.findMany({
      where: { postId },
      include: { user: true },
      orderBy: { tokens: "desc" },
      take: 10,
    });

    // Build holders list — include creator from onchain if not in DB
    let holdings = dbHoldings.map((h) => ({
      walletAddress: h.user.walletAddress,
      username: h.user.username,
      tokens: h.tokens,
    }));

    // Add creator if they have tokens onchain but not in DB holdings
    if (onchain && onchain.creator) {
      const creatorWallet = (onchain.creator as string).toLowerCase();
      const creatorInList = holdings.some((h) => h.walletAddress.toLowerCase() === creatorWallet);
      if (!creatorInList) {
        try {
          const creatorBalance = await publicClient.readContract({
            address: addresses.vault,
            abi: VAULT_ABI,
            functionName: "balanceOf",
            args: [postIdBytes as `0x${string}`, onchain.creator as `0x${string}`],
          });
          const bal = Number(creatorBalance) / 1e18;
          if (bal > 0) {
            holdings = [{ walletAddress: creatorWallet, username: post.author.username, tokens: bal }, ...holdings];
          }
        } catch {}
      }
    }

    return NextResponse.json({
      post: {
        id: post.id,
        tag: post.tag,
        content: post.content,
        coinAddress: post.coinAddress,
        contentHash: post.contentHash,
        txHash: post.txHash,
        price: post.price,
        priceChange: post.priceChange,
        holders: post.holders,
        createdAt: post.createdAt,
      },
      author: { walletAddress: post.author.walletAddress, username: post.author.username, kind: post.author.kind },
      onchain,
      trades,
      holders: holdings,
    });
  } catch (error) {
    console.error("Coin info error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
