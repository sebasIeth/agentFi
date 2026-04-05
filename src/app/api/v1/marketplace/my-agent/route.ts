import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";
import { publicClient, getContractAddresses } from "@/lib/chain";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const user = await db.user.findUnique({ where: { walletAddress: wallet.toLowerCase() } });
  if (!user) return NextResponse.json({ agents: [] });

  const agents = await db.agent.findMany({
    where: { ownerId: user.id, isManaged: true, isActive: true },
    include: {
      posts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  const agentData = await Promise.all(agents.map(async (a) => {
    // Get agent's user id to check holdings
    let agentUserId = a.ownerId;
    if (a.avatarUrl) {
      const agentUser = await db.user.findUnique({ where: { walletAddress: a.avatarUrl.toLowerCase() } });
      if (agentUser) agentUserId = agentUser.id;
    }

    const holdings = await db.holding.findMany({
      where: { userId: agentUserId },
      include: { post: { select: { price: true, tag: true } } },
    });

    const holdingsValue = holdings.reduce((sum, h) => sum + (h.tokens * h.post.price), 0);
    const holdingsCount = holdings.length;

    // Sum of all trade volume
    const tradeStats = await db.trade.aggregate({
      where: { userId: agentUserId },
      _sum: { amount: true },
      _count: true,
    });

    // Recent trades
    const recentTrades = await db.trade.findMany({
      where: { userId: agentUserId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { post: { select: { tag: true, price: true } } },
    });

    return {
      id: a.id,
      name: a.name,
      ens: a.ens,
      type: a.type,
      category: TEMPLATES[a.type]?.category || "poster",
      wallet: a.avatarUrl || null,
      isActive: a.isActive,
      lastPostedAt: a.lastPostedAt,
      managedPosts: a.managedPosts,
      totalFees: a.totalFees,
      holdingsValue,
      holdingsCount,
      totalTrades: tradeStats._count || 0,
      totalVolume: tradeStats._sum.amount || 0,
      recentTrades: recentTrades.map(t => ({
        type: t.type,
        amount: t.amount,
        tokens: t.tokens,
        tag: t.post.tag,
        txHash: t.txHash,
        createdAt: t.createdAt,
      })),
      usdcBalance: 0,
    };
  }));

  // Fetch on-chain USDC balances for all agents
  const addresses = getContractAddresses();
  const ERC20_BALANCE = [{ name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] }] as const;

  for (const agent of agentData) {
    if (agent.wallet) {
      try {
        const bal = await publicClient.readContract({
          address: addresses.usdc, abi: ERC20_BALANCE, functionName: "balanceOf", args: [agent.wallet as `0x${string}`],
        });
        agent.usdcBalance = Number(bal) / 1e6;
      } catch {}
    }
  }

  return NextResponse.json({ agents: agentData });
}

export async function DELETE(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const user = await db.user.findUnique({ where: { walletAddress: wallet.toLowerCase() } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const where = agentId
    ? { id: agentId, ownerId: user.id, isManaged: true, isActive: true }
    : { ownerId: user.id, isManaged: true, isActive: true };

  const agent = await db.agent.findFirst({ where });
  if (!agent) return NextResponse.json({ error: "No active managed agent" }, { status: 404 });

  await db.agent.update({
    where: { id: agent.id },
    data: { isActive: false },
  });

  return NextResponse.json({ deactivated: true });
}
