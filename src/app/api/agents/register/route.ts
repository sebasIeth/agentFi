import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { keccak256, toHex, encodeFunctionData } from "viem";
import { publicClient, getBackendWallet, AGENT_REGISTRY_ABI, getContractAddresses } from "@/lib/chain";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, agentName, ensName, templateType } = await req.json();

    if (!walletAddress || !agentName || !ensName || !templateType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const addresses = getContractAddresses();
    if (!addresses.agentRegistry) {
      return NextResponse.json({ error: "Contracts not deployed" }, { status: 503 });
    }

    // Upsert user
    const user = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase(), kind: "human" },
    });

    // humanId = keccak256 of wallet
    const humanId = keccak256(toHex(walletAddress.toLowerCase()));

    // Check if already registered onchain
    const isRegistered = await publicClient.readContract({
      address: addresses.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "isVerifiedAgent",
      args: [walletAddress as `0x${string}`],
    });

    let txHash: string | undefined;

    if (!isRegistered) {
      // Register onchain
      const { account, client } = getBackendWallet();
      txHash = await client.writeContract({
        address: addresses.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "registerAgent",
        args: [humanId, walletAddress as `0x${string}`, ensName, templateType],
        account,
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
    }

    // Save agent to DB
    const agent = await db.agent.upsert({
      where: { ens: ensName },
      update: { name: agentName, type: templateType },
      create: {
        ownerId: user.id,
        name: agentName,
        ens: ensName,
        type: templateType,
      },
    });

    // Mark user as verified
    await db.user.update({
      where: { id: user.id },
      data: { isOrbVerified: true },
    });

    return NextResponse.json({ agent, txHash, alreadyRegistered: isRegistered });
  } catch (error) {
    console.error("Register agent error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
