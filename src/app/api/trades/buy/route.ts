import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encodeFunctionData, parseUnits, keccak256, toHex } from "viem";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, postId, usdcAmount } = await req.json();

    if (!walletAddress || !postId || !usdcAmount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    if (typeof usdcAmount !== 'number' || usdcAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const addresses = getContractAddresses();
    const usdcParsed = parseUnits(usdcAmount.toString(), 6);

    // Get the post to find its pool ID
    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const poolId = (post.contentHash || keccak256(toHex(postId))) as `0x${string}`;

    // Get quote from chain
    const tokensOut = await publicClient.readContract({
      address: addresses.vault,
      abi: VAULT_ABI,
      functionName: "getBuyQuote",
      args: [poolId, usdcParsed],
    });

    // Build transactions for MiniKit.sendTransaction
    // 1. Approve USDC to Vault
    const approveData = encodeFunctionData({
      abi: [{ name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }],
      functionName: "approve",
      args: [addresses.vault, usdcParsed],
    });

    // 2. Buy tokens
    const minTokens = (tokensOut as bigint) * BigInt(95) / BigInt(100); // 5% slippage
    const buyData = encodeFunctionData({
      abi: VAULT_ABI,
      functionName: "buy",
      args: [poolId, usdcParsed, minTokens],
    });

    return NextResponse.json({
      quote: {
        usdcIn: usdcAmount,
        tokensOut: tokensOut.toString(),
        minTokensOut: minTokens.toString(),
        pricePerToken: (Number(usdcParsed) / Number(tokensOut)).toFixed(6),
      },
      transactions: [
        { to: addresses.usdc, data: approveData },
        { to: addresses.vault, data: buyData },
      ],
      poolId,
    });
  } catch (error) {
    console.error("Buy error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
