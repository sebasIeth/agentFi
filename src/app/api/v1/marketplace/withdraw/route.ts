import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptKey } from "@/lib/crypto";
import { createWalletClient, createPublicClient, http, defineChain, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const worldchain = defineChain({
  id: 480,
  name: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://worldchain-mainnet.g.alchemy.com/public"] } },
});

const ERC20_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, agentId } = await req.json();

    if (!walletAddress || !agentId) {
      return NextResponse.json({ error: "Missing walletAddress or agentId" }, { status: 400 });
    }

    const humanUser = await db.user.findUnique({ where: { walletAddress: walletAddress.toLowerCase() } });
    if (!humanUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const agent = await db.agent.findFirst({
      where: { id: agentId, ownerId: humanUser.id, isManaged: true },
    });
    if (!agent) return NextResponse.json({ error: "Agent not found or not yours" }, { status: 403 });
    if (!agent.encryptedKey) return NextResponse.json({ error: "Agent has no wallet key" }, { status: 400 });

    const pk = decryptKey(agent.encryptedKey);
    const agentAccount = privateKeyToAccount(pk as `0x${string}`);
    const rpc = process.env.WORLD_CHAIN_RPC || "https://worldchain-mainnet.g.alchemy.com/public";
    const pub = createPublicClient({ chain: worldchain, transport: http(rpc) });
    const agentClient = createWalletClient({ account: agentAccount, chain: worldchain, transport: http(rpc) });

    const usdcAddress = (process.env.USDC_ADDRESS || "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1") as `0x${string}`;

    // Check agent USDC balance
    const balance = await pub.readContract({
      address: usdcAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [agentAccount.address],
    });

    if (balance === BigInt(0)) {
      return NextResponse.json({ error: "No USDC to withdraw", balance: "0" }, { status: 400 });
    }

    // Transfer all USDC to the human owner
    // Agent needs ETH for gas — use relayer to send gas first
    const agentEth = await pub.getBalance({ address: agentAccount.address });
    if (agentEth < BigInt(50000000000000)) { // < 0.00005 ETH
      // Send gas from relayer
      const { getBackendWallet, publicClient } = await import("@/lib/chain");
      const { account: relayerAccount, client: relayerClient } = getBackendWallet();
      const gasTx = await relayerClient.sendTransaction({
        to: agentAccount.address, value: BigInt("100000000000000"), account: relayerAccount,
      });
      await publicClient.waitForTransactionReceipt({ hash: gasTx });
    }

    // Transfer USDC
    const txHash = await agentClient.writeContract({
      address: usdcAddress, abi: ERC20_ABI, functionName: "transfer",
      args: [walletAddress as `0x${string}`, balance], account: agentAccount,
    });
    await pub.waitForTransactionReceipt({ hash: txHash });

    const amountStr = (Number(balance) / 1e6).toFixed(6);

    return NextResponse.json({
      success: true,
      amount: amountStr,
      txHash,
      to: walletAddress,
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Withdraw failed" }, { status: 500 });
  }
}
