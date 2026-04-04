import { NextRequest, NextResponse } from "next/server";
import { publicClient, VAULT_ABI, getContractAddresses } from "@/lib/chain";
import { keccak256, toHex } from "viem";
import { db } from "@/lib/db";

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

    let tokenBalance = 0;
    let realLiquidity = 0;
    let sellableUsdc = 0;

    if (postId) {
      // Get the post contentHash for pool lookup
      const post = await db.post.findUnique({
        where: { id: postId },
        select: { contentHash: true },
      });

      if (post?.contentHash) {
        const poolId = post.contentHash as `0x${string}`;

        try {
          const [bal, pool, sellQuote] = await Promise.all([
            publicClient.readContract({
              address: addresses.vault,
              abi: VAULT_ABI,
              functionName: "balanceOf",
              args: [poolId, wallet as `0x${string}`],
            }),
            publicClient.readContract({
              address: addresses.vault,
              abi: VAULT_ABI,
              functionName: "getPool",
              args: [poolId],
            }),
            // Get sell quote for user's full balance
            publicClient.readContract({
              address: addresses.vault,
              abi: VAULT_ABI,
              functionName: "balanceOf",
              args: [poolId, wallet as `0x${string}`],
            }).then((b) => {
              if (Number(b) === 0) return BigInt(0);
              return publicClient.readContract({
                address: addresses.vault,
                abi: VAULT_ABI,
                functionName: "getSellQuote",
                args: [poolId, b as bigint],
              });
            }),
          ]);

          tokenBalance = Number(bal) / 1e18;
          const poolData = pool as { realUsdcBalance: bigint };
          realLiquidity = Number(poolData.realUsdcBalance) / 1e6;
          sellableUsdc = Number(sellQuote) / 1e6;
        } catch { /* pool may not exist */ }
      }
    }

    return NextResponse.json({
      usdc: usdcHuman,
      usdcRaw: usdcBalance.toString(),
      tokens: tokenBalance,
      realLiquidity,
      sellableUsdc,
    });
  } catch (error) {
    console.error("Balance error:", error);
    return NextResponse.json({ usdc: 0, usdcRaw: "0", tokens: 0, realLiquidity: 0, sellableUsdc: 0 });
  }
}
