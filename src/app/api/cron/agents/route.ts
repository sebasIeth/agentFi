import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";
import { generateContent } from "@/lib/ai-generate";
import { uploadToZeroG } from "@/lib/zerog";
import { keccak256, toHex } from "viem";
import { publicClient, getBackendWallet, VAULT_ABI, getContractAddresses } from "@/lib/chain";

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      where: { isManaged: true, isActive: true },
      include: {
        owner: true,
        posts: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });

    if (agents.length === 0) {
      return NextResponse.json({ message: "No active managed agents", posted: 0 });
    }

    let posted = 0;

    for (const agent of agents) {
      const template = TEMPLATES[agent.type];
      if (!template) continue;

      const now = Date.now();
      const lastPost = agent.lastPostedAt?.getTime() || 0;
      const intervalMs = template.intervalMin * 60 * 1000;

      if (now - lastPost < intervalMs) continue;

      try {
        const lastPosts = agent.posts
          .map((p) => p.contentPreview || p.content)
          .filter(Boolean) as string[];

        const content = await generateContent(
          template.systemPrompt,
          template.buildUserPrompt({ lastPosts, timestamp: new Date().toISOString() })
        );

        if (!content || content.length < 10) continue;

        const shortId = Math.random().toString(36).slice(2, 6).toUpperCase();
        const tag = `$${template.tickerPrefix}-${shortId}`;
        const contentPreview = content.slice(0, 280);

        const contentObject = {
          version: "1.0",
          text: content,
          image: null,
          agent: agent.ens,
          timestamp: new Date().toISOString(),
          managed: true,
        };

        let zeroGHash: string | null = null;
        let contentHash: string;

        try {
          zeroGHash = await uploadToZeroG(JSON.stringify(contentObject));
          contentHash = zeroGHash;
        } catch {
          contentHash = keccak256(toHex(JSON.stringify(contentObject)));
        }

        // Find or use the agent's own User (kind: "agent") to post as
        // avatarUrl stores the agent wallet address
        const agentWallet = agent.avatarUrl;
        let agentUserId = agent.ownerId;
        if (agentWallet) {
          const agentUser = await db.user.findUnique({ where: { walletAddress: agentWallet.toLowerCase() } });
          if (agentUser) agentUserId = agentUser.id;
        }

        const post = await db.post.create({
          data: {
            author: { connect: { id: agentUserId } },
            agent: { connect: { id: agent.id } },
            content: zeroGHash ? null : content,
            contentPreview,
            tag,
            contentHash,
            zeroGHash,
            price: 0,
            priceChange: 0,
            holders: 0,
          },
        });

        const creatorWallet = agentWallet || agent.owner.walletAddress;
        const addresses = getContractAddresses();
        if (addresses.vault) {
          try {
            const { account, client } = getBackendWallet();
            const poolIdBytes = keccak256(toHex(post.id));

            const txHash = await client.writeContract({
              address: addresses.vault,
              abi: VAULT_ABI,
              functionName: "createPool",
              args: [poolIdBytes, creatorWallet as `0x${string}`],
              account,
            });

            await publicClient.waitForTransactionReceipt({ hash: txHash });

            const price = await publicClient.readContract({
              address: addresses.vault,
              abi: VAULT_ABI,
              functionName: "getPrice",
              args: [poolIdBytes],
            });

            await db.post.update({
              where: { id: post.id },
              data: {
                coinAddress: addresses.vault,
                contentHash: poolIdBytes,
                txHash,
                price: Number(price) / 1e6,
                holders: 1,
              },
            });
          } catch {}
        }

        await db.agent.update({
          where: { id: agent.id },
          data: {
            lastPostedAt: new Date(),
            managedPosts: { increment: 1 },
          },
        });

        posted++;
      } catch {}
    }

    return NextResponse.json({ message: `Processed ${agents.length} agents`, posted });
  } catch (error) {
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
