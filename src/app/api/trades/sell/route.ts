import { NextRequest, NextResponse } from "next/server";
import { encodeFunctionData, parseUnits } from "viem";
import { publicClient, POST_COIN_ABI } from "@/lib/chain";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, coinAddress, tokenAmount } = await req.json();

    if (!walletAddress || !coinAddress || !tokenAmount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const tokensParsed = parseUnits(tokenAmount.toString(), 18);

    // Get quote from chain
    const usdcOut = await publicClient.readContract({
      address: coinAddress as `0x${string}`,
      abi: POST_COIN_ABI,
      functionName: "getSellQuote",
      args: [tokensParsed],
    });

    // Build unsigned tx for frontend
    const txData = encodeFunctionData({
      abi: POST_COIN_ABI,
      functionName: "sell",
      args: [tokensParsed],
    });

    return NextResponse.json({
      quote: {
        tokensIn: tokenAmount,
        usdcOut: usdcOut.toString(),
      },
      transactions: [
        {
          to: coinAddress,
          data: txData,
          description: "Sell tokens",
        },
      ],
    });
  } catch (error) {
    console.error("Sell error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
