import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, templateType } = await req.json();

    if (!walletAddress || !templateType) {
      return NextResponse.json({ error: "Missing walletAddress or templateType" }, { status: 400 });
    }

    if (!TEMPLATES[templateType]) {
      return NextResponse.json({ error: "Invalid template. Use: trader or poster" }, { status: 400 });
    }

    const humanUser = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase(), kind: "human" },
    });

    const existing = await db.agent.findFirst({
      where: { ownerId: humanUser.id, isManaged: true, isActive: true },
    });

    if (existing) {
      return NextResponse.json({ error: "You already have a managed agent. Only 1 per user." }, { status: 409 });
    }

    const template = TEMPLATES[templateType];
    const shortId = Math.random().toString(36).slice(2, 8);
    const ensName = `${templateType}-${shortId}.agentfi.eth`;

    // Create a separate User for the agent to post as (kind: "agent")
    const agentWallet = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(20))).toString("hex")}`;
    const agentUser = await db.user.create({
      data: {
        walletAddress: agentWallet.toLowerCase(),
        username: `${template.displayName} #${shortId}`,
        kind: "agent",
      },
    });

    // ownerId = human (for my-agent lookup), agent posts as agentUser via agentUser wallet stored in ens
    const agent = await db.agent.create({
      data: {
        ownerId: humanUser.id,
        name: `${template.displayName} #${shortId}`,
        ens: ensName,
        type: templateType,
        avatarUrl: agentUser.walletAddress, // store agent wallet here for cron to use
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
