import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keccak256, toHex } from "viem";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

// Called after MiniKit.sendTransaction() completes
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, postId, txHash, type, usdcAmount } = await req.json();

    if (!walletAddress || !postId || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const addresses = getContractAddresses();

    // Get post to find poolId
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const poolId = (post.contentHash || keccak256(toHex(postId))) as `0x${string}`;

    // Read current state from Vault (don't wait for receipt — userOpHash != txHash)
    let tokenBalance = 0;
    let price = 0;
    let totalSupply = 0;
    let holders = 0;

    try {
      const [bal, p, pool, h] = await Promise.all([
        publicClient.readContract({
          address: addresses.vault,
          abi: VAULT_ABI,
          functionName: "balanceOf",
          args: [poolId, walletAddress as `0x${string}`],
        }),
        publicClient.readContract({
          address: addresses.vault,
          abi: VAULT_ABI,
          functionName: "getPrice",
          args: [poolId],
        }),
        publicClient.readContract({
          address: addresses.vault,
          abi: VAULT_ABI,
          functionName: "getPool",
          args: [poolId],
        }),
        publicClient.readContract({
          address: addresses.vault,
          abi: VAULT_ABI,
          functionName: "holderCount",
          args: [poolId],
        }),
      ]);

      tokenBalance = Number(bal) / 1e18;
      price = Number(p) / 1e6;
      const poolData = pool as { totalSupply: bigint };
      totalSupply = Number(poolData.totalSupply) / 1e18;
      holders = Number(h);
    } catch (err) {
      console.error("Vault read after trade:", err);
    }

    // Upsert user
    const user = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase(), kind: "human" },
    });

    // Save trade to DB
    const trade = await db.trade.create({
      data: {
        userId: user.id,
        postId,
        type,
        amount: usdcAmount || 0,
        tokens: tokenBalance,
        txHash: txHash || null,
      },
    });

    // Update holdings
    await db.holding.upsert({
      where: { userId_postId: { userId: user.id, postId } },
      update: { tokens: tokenBalance },
      create: {
        userId: user.id,
        postId,
        tokens: tokenBalance,
        avgBuyPrice: price,
      },
    });

    // Calculate price change vs previous price
    const oldPrice = post.price || 0;
    const priceChange = oldPrice > 0 ? ((price - oldPrice) / oldPrice) * 100 : 0;

    // Update post with latest price, price change, and holder count
    await db.post.update({
      where: { id: postId },
      data: {
        price,
        priceChange,
        holders,
      },
    });

    // Save snapshot for chart history
    if (post.coinAddress && post.contentHash) {
      await db.coinSnapshot.create({
        data: {
          coinAddress: post.coinAddress,
          postId,
          price,
          marketCap: price * totalSupply,
          holders,
        },
      });
    }

    return NextResponse.json({
      trade,
      tokenBalance,
      price,
      totalSupply,
      holders,
    });
  } catch (error) {
    console.error("Confirm trade error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
