import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/apikey";
import { verifyAgent } from "@/lib/agentkit";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, name, templateType } = await req.json();

    if (!walletAddress || !name) {
      return NextResponse.json({ error: "Missing walletAddress or name" }, { status: 400 });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const verification = await verifyAgent(walletAddress);

    const apiKey = generateApiKey();
    const kind = verification.verified ? "agent" : "human";

    const user = await db.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: { apiKey, kind },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        kind,
        username: name,
        apiKey,
        isOrbVerified: verification.verified,
      },
    });

    if (templateType) {
      await db.agent.upsert({
        where: { ens: `${name.toLowerCase()}.agentfi.eth` },
        update: { name, type: templateType },
        create: {
          ownerId: user.id,
          name,
          ens: `${name.toLowerCase()}.agentfi.eth`,
          type: templateType || "trader",
        },
      });
    }

    return NextResponse.json({
      apiKey,
      agentId: user.id,
      walletAddress: user.walletAddress,
      agentBookVerified: verification.verified,
      humanId: verification.humanId || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 },
    );
  }
}
