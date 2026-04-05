import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { agentId, name } = await req.json();
    if (!agentId || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    await db.agent.update({ where: { id: agentId }, data: { name: name.slice(0, 50) } });

    // Also update the agent's User username
    if (agent.avatarUrl) {
      await db.user.updateMany({
        where: { walletAddress: agent.avatarUrl.toLowerCase() },
        data: { username: name.slice(0, 50) },
      });
    }

    return NextResponse.json({ success: true, name: name.slice(0, 50) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
