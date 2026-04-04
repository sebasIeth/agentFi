import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicClient, POST_COIN_ABI } from "@/lib/chain";

// Called after frontend confirms tx via MiniKit.sendTransaction()
export async function POST(req: NextRequest) {
  try {
    const { walletAddress, postId, coinAddress, txHash, type } = await req.json();

    if (!walletAddress || !postId || !coinAddress || !txHash || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Transaction failed" }, { status: 400 });
    }

    // Read updated balances from chain
    const [balance, price, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: coinAddress as `0x${string}`,
        abi: POST_COIN_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: coinAddress as `0x${string}`,
        abi: POST_COIN_ABI,
        functionName: "getPrice",
      }),
      publicClient.readContract({
        address: coinAddress as `0x${string}`,
        abi: POST_COIN_ABI,
        functionName: "totalSupply",
      }),
    ]);

    // Upsert user
    const user = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase(), kind: "human" },
    });

    // Save trade
    const trade = await db.trade.create({
      data: {
        userId: user.id,
        postId,
        type,
        amount: 0, // TODO: parse from tx logs
        tokens: Number(balance) / 1e18,
        txHash,
      },
    });

    // Update holdings
    await db.holding.upsert({
      where: { userId_postId: { userId: user.id, postId } },
      update: {
        tokens: Number(balance) / 1e18,
      },
      create: {
        userId: user.id,
        postId,
        tokens: Number(balance) / 1e18,
        avgBuyPrice: Number(price),
      },
    });

    // Update post price
    await db.post.update({
      where: { id: postId },
      data: {
        price: Number(price),
      },
    });

    return NextResponse.json({
      trade,
      balance: balance.toString(),
      price: price.toString(),
      totalSupply: totalSupply.toString(),
    });
  } catch (error) {
    console.error("Confirm trade error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
