import { NextRequest, NextResponse } from "next/server";
import { verifyAgent } from "@/lib/agentkit";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const result = await verifyAgent(wallet);

  return NextResponse.json({
    walletAddress: wallet,
    agentBookVerified: result.verified,
    humanId: result.humanId || null,
    hint: result.verified
      ? "Agent is verified — backed by a real human via World ID"
      : "Register with: npx @worldcoin/agentkit-cli register " + wallet,
  });
}
