import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";
import { ethers } from "ethers";
import { encryptKey } from "@/lib/crypto";

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
