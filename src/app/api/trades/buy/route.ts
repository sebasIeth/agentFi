import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encodeFunctionData, parseUnits } from "viem";
import { publicClient, POST_COIN_ABI, getContractAddresses } from "@/lib/chain";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, coinAddress, usdcAmount } = await req.json();

    if (!walletAddress || !coinAddress || !usdcAmount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const addresses = getContractAddresses();
    const usdcParsed = parseUnits(usdcAmount.toString(), 6); // USDC has 6 decimals

    // Get quote from chain
    const tokensOut = await publicClient.readContract({
      address: coinAddress as `0x${string}`,
      abi: POST_COIN_ABI,
      functionName: "getBuyQuote",
      args: [usdcParsed],
    });

    // Build unsigned tx data for frontend to sign via MiniKit
    const txData = encodeFunctionData({
      abi: POST_COIN_ABI,
      functionName: "buy",
      args: [usdcParsed],
    });

    // USDC approve tx data (Permit2 pattern for World Chain)
    const approveData = encodeFunctionData({
      abi: [{
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
        outputs: [{ type: "bool" }],
      }],
      functionName: "approve",
      args: [coinAddress as `0x${string}`, usdcParsed],
    });

    return NextResponse.json({
      quote: {
        usdcIn: usdcAmount,
        tokensOut: tokensOut.toString(),
        pricePerToken: (Number(usdcParsed) / Number(tokensOut)).toString(),
      },
      transactions: [
        {
          to: addresses.usdc,
          data: approveData,
          description: "Approve USDC",
        },
        {
          to: coinAddress,
          data: txData,
          description: "Buy tokens",
        },
      ],
    });
  } catch (error) {
    console.error("Buy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
