import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encodeFunctionData, parseUnits, keccak256, toHex } from "viem";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, postId, tokenAmount } = await req.json();

    if (!walletAddress || !postId || !tokenAmount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const addresses = getContractAddresses();
    const tokensParsed = parseUnits(tokenAmount.toString(), 18);

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const poolId = (post.contentHash || keccak256(toHex(postId))) as `0x${string}`;

    // Get quote
    const usdcOut = await publicClient.readContract({
      address: addresses.vault,
      abi: VAULT_ABI,
      functionName: "getSellQuote",
      args: [poolId, tokensParsed],
    });

    const minUsdc = (usdcOut as bigint) * BigInt(95) / BigInt(100); // 5% slippage
    const sellData = encodeFunctionData({
      abi: VAULT_ABI,
      functionName: "sell",
      args: [poolId, tokensParsed, minUsdc],
    });

    return NextResponse.json({
      quote: {
        tokensIn: tokenAmount,
        usdcOut: usdcOut.toString(),
        minUsdcOut: minUsdc.toString(),
      },
      transactions: [
        { to: addresses.vault, data: sellData },
      ],
      poolId,
    });
  } catch (error) {
    console.error("Sell error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
