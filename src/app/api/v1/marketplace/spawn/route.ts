import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";
import { ethers } from "ethers";
import { encryptKey } from "@/lib/crypto";
import { getBackendWallet, getContractAddresses, publicClient } from "@/lib/chain";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, templateType } = await req.json();

    if (!walletAddress || !templateType) {
      return NextResponse.json({ error: "Missing walletAddress or templateType" }, { status: 400 });
    }

    const template = TEMPLATES[templateType];
    if (!template) {
      return NextResponse.json({ error: "Invalid template type" }, { status: 400 });
    }

    const humanUser = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase(), kind: "human" },
    });

    const count = await db.agent.count({
      where: { ownerId: humanUser.id, isManaged: true, isActive: true },
    });
    if (count >= 5) {
      return NextResponse.json({ error: "Max 5 active agents per user" }, { status: 409 });
    }

    const shortId = Math.random().toString(36).slice(2, 8);
    const ensName = `${templateType.replace("_", "-")}-${shortId}.agentfi.eth`;

    // Generate a real wallet for the agent
    const agentWallet = ethers.Wallet.createRandom();
    const agentAddress = agentWallet.address.toLowerCase();
    const encrypted = encryptKey(agentWallet.privateKey);

    // For trader agents: relayer sends tiny ETH for gas, agent approves relayer for USDC
    if (template.category === "trader") {
      try {
        const addresses = getContractAddresses();
        const { account: relayerAccount, client: relayerClient } = getBackendWallet();

        // 1. Relayer sends gas ETH to agent (enough for 1 approve tx)
        const gasFund = await relayerClient.sendTransaction({
          to: agentWallet.address as `0x${string}`,
          value: BigInt("100000000000000"), // 0.0001 ETH
          account: relayerAccount,
        });
        await publicClient.waitForTransactionReceipt({ hash: gasFund });

        // 2. Agent approves relayer for infinite USDC
        const { createWalletClient, http } = await import("viem");
        const { privateKeyToAccount } = await import("viem/accounts");
        const { worldchain } = await import("@/lib/chain");

        const agentAccount = privateKeyToAccount(agentWallet.privateKey as `0x${string}`);
        const agentClient = createWalletClient({
          account: agentAccount,
          chain: worldchain,
          transport: http(process.env.WORLD_CHAIN_RPC || "https://worldchain-mainnet.g.alchemy.com/public"),
        });

        const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        const approveTx = await agentClient.writeContract({
          address: addresses.usdc,
          abi: [{ name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }] as const,
          functionName: "approve",
          args: [relayerAccount.address, maxApproval],
          account: agentAccount,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });

        console.log(`Agent ${ensName} approved relayer for USDC. Gas tx: ${gasFund}, Approve tx: ${approveTx}`);
      } catch (e) {
        console.error("Spawn approve error:", e instanceof Error ? e.message : e);
        // Continue anyway, approval can be retried
      }
    }

    // Create agent User (kind: "agent")
    const agentUser = await db.user.create({
      data: {
        walletAddress: agentAddress,
        username: `${template.displayName} #${shortId}`,
        kind: "agent",
      },
    });

    const agent = await db.agent.create({
      data: {
        ownerId: humanUser.id,
        name: `${template.displayName} #${shortId}`,
        ens: ensName,
        type: templateType,
        avatarUrl: agentAddress,
        encryptedKey: encrypted,
        isManaged: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        ens: agent.ens,
        type: agent.type,
        category: template.category,
        wallet: agentAddress,
        isActive: true,
        lastPostedAt: null,
        managedPosts: 0,
        totalFees: 0,
      },
      firstPostIn: "Next cron cycle (~3 min)",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Spawn failed" },
      { status: 500 },
    );
  }
}
