import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";

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

    // Max 5 agents per user
    const count = await db.agent.count({
      where: { ownerId: humanUser.id, isManaged: true, isActive: true },
    });
    if (count >= 5) {
      return NextResponse.json({ error: "Max 5 active agents per user" }, { status: 409 });
    }

    const shortId = Math.random().toString(36).slice(2, 8);
    const ensName = `${templateType.replace("_", "-")}-${shortId}.agentfi.eth`;

    // Create agent User (kind: "agent")
    const agentWallet = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(20))).toString("hex")}`;
    const agentUser = await db.user.create({
      data: {
        walletAddress: agentWallet.toLowerCase(),
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
        avatarUrl: agentUser.walletAddress, // agent wallet for posting
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
