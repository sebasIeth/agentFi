import { NextRequest, NextResponse } from "next/server";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";
import { keccak256, toHex } from "viem";

const ERC20_BALANCE_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const postId = req.nextUrl.searchParams.get("postId");

  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const addresses = getContractAddresses();

  try {
    // Get USDC balance
    const usdcBalance = await publicClient.readContract({
      address: addresses.usdc,
      abi: ERC20_BALANCE_ABI,
      functionName: "balanceOf",
      args: [wallet as `0x${string}`],
    });

    const usdcHuman = Number(usdcBalance) / 1e6;

    // Get token balance if postId provided
    let tokenBalance = 0;
    if (postId) {
      try {
        const poolId = keccak256(toHex(postId)) as `0x${string}`;
        const bal = await publicClient.readContract({
          address: addresses.vault,
          abi: VAULT_ABI,
          functionName: "balanceOf",
          args: [poolId, wallet as `0x${string}`],
        });
        tokenBalance = Number(bal) / 1e18;
      } catch { /* pool may not exist */ }
    }

    return NextResponse.json({
      usdc: usdcHuman,
      usdcRaw: usdcBalance.toString(),
      tokens: tokenBalance,
    });
  } catch (error) {
    console.error("Balance error:", error);
    return NextResponse.json({ usdc: 0, usdcRaw: "0", tokens: 0 });
  }
}
