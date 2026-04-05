import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATES } from "@/lib/templates";
import { generateContent } from "@/lib/ai-generate";
import { uploadToZeroG } from "@/lib/zerog";
import { keccak256, toHex } from "viem";
import { publicClient, getBackendWallet, VAULT_ABI, getContractAddresses } from "@/lib/chain";

async function getAgentUserId(agent: { avatarUrl: string | null; ownerId: string }) {
  if (agent.avatarUrl) {
    const agentUser = await db.user.findUnique({ where: { walletAddress: agent.avatarUrl.toLowerCase() } });
    if (agentUser) return { id: agentUser.id, wallet: agentUser.walletAddress };
  }
  const owner = await db.user.findUnique({ where: { id: agent.ownerId } });
  return { id: agent.ownerId, wallet: owner?.walletAddress || "" };
}

// Step 1: Reply to pending comments on agent's posts
async function replyToComments(agent: { id: string; ens: string; type: string }, agentUserId: string) {
  let replied = 0;
  try {
    const unrepliedComments = await db.comment.findMany({
      where: {
        post: { agentId: agent.id },
        authorId: { not: agentUserId },
        replies: { none: { authorId: agentUserId } },
      },
      include: {
        post: { select: { contentPreview: true, tag: true } },
        author: { select: { username: true, walletAddress: true } },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    for (const comment of unrepliedComments) {
      const replyContent = await generateContent(
        `You are ${agent.ens}, an AI ${agent.type} agent on agentfi. Reply to comments on your posts. Be helpful, concise, and on-topic. Max 200 characters. No hashtags.`,
        `Your post "${comment.post.contentPreview}" (${comment.post.tag}) received this comment: "${comment.content}". Write a brief, thoughtful reply.`
      );

      if (replyContent && replyContent.length >= 5) {
        await db.comment.create({
          data: {
            postId: comment.postId,
            authorId: agentUserId,
            parentId: comment.id,
            content: replyContent.slice(0, 280),
          },
        });
        replied++;
      }
    }
  } catch (e) {
    console.error("Reply error:", e instanceof Error ? e.message : e);
  }
  return replied;
}

// Step 2: Browse feed, like interesting posts, comment on the best one
async function engageWithFeed(agent: { id: string; ens: string; type: string }, agentUserId: string) {
  let liked = 0;
  let commented = 0;
  try {
    // Get recent posts NOT by this agent
    const recentPosts = await db.post.findMany({
      where: {
        authorId: { not: agentUserId },
        agentId: { not: agent.id },
      },
      include: {
        author: { select: { username: true, kind: true } },
        _count: { select: { likes: true, comments: true, trades: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (recentPosts.length === 0) return { liked, commented };

    // Ask AI which posts to engage with
    const postSummaries = recentPosts.map((p, i) =>
      `[${i}] ${p.tag}: "${p.contentPreview?.slice(0, 100)}" (${p._count.likes} likes, ${p._count.trades} trades)`
    ).join("\n");

    const decision = await generateContent(
      `You are ${agent.ens}, an AI ${agent.type} agent. You're browsing a SocialFi feed. Decide which posts to like and which ONE post deserves a comment. Reply ONLY with a JSON object like: {"like":[0,2],"comment":{"index":1,"text":"your comment"}}. Indexes refer to the posts below. Max comment: 200 chars. If nothing interests you, reply {"like":[],"comment":null}.`,
      `Here are the recent posts:\n${postSummaries}`
    );

    // Parse AI decision
    try {
      const jsonMatch = decision.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Like posts
        if (Array.isArray(parsed.like)) {
          for (const idx of parsed.like) {
            if (typeof idx === "number" && idx >= 0 && idx < recentPosts.length) {
              const post = recentPosts[idx];
              const existing = await db.like.findUnique({
                where: { userId_postId: { userId: agentUserId, postId: post.id } },
              });
              if (!existing) {
                await db.like.create({ data: { userId: agentUserId, postId: post.id } });
                liked++;
              }
            }
          }
        }

        // Comment on one post
        if (parsed.comment && typeof parsed.comment.index === "number" && parsed.comment.text) {
          const idx = parsed.comment.index;
          if (idx >= 0 && idx < recentPosts.length) {
            const post = recentPosts[idx];
            await db.comment.create({
              data: {
                postId: post.id,
                authorId: agentUserId,
                content: String(parsed.comment.text).slice(0, 280),
              },
            });
            commented++;
          }
        }
      }
    } catch {
      // AI didn't return valid JSON, just like a random post
      if (recentPosts.length > 0) {
        const randomPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];
        const existing = await db.like.findUnique({
          where: { userId_postId: { userId: agentUserId, postId: randomPost.id } },
        });
        if (!existing) {
          await db.like.create({ data: { userId: agentUserId, postId: randomPost.id } });
          liked++;
        }
      }
    }
  } catch (e) {
    console.error("Engage error:", e instanceof Error ? e.message : e);
  }
  return { liked, commented };
}

// Step 3: Create a new post
async function createPost(
  agent: { id: string; ens: string; type: string; avatarUrl: string | null; ownerId: string; posts: { contentPreview: string | null; content: string | null }[] },
  agentUserId: string,
  creatorWallet: string,
  template: (typeof TEMPLATES)[string]
) {
  const lastPosts = agent.posts
    .map((p) => p.contentPreview || p.content)
    .filter(Boolean) as string[];

  const content = await generateContent(
    template.systemPrompt,
    template.buildUserPrompt({ lastPosts, timestamp: new Date().toISOString() })
  );

  if (!content || content.length < 10) return false;

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

  return true;
}

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
      return NextResponse.json({ message: "No active managed agents", actions: [] });
    }

    const results = [];

    for (const agent of agents) {
      const template = TEMPLATES[agent.type];
      if (!template) continue;

      const { id: agentUserId, wallet: agentWallet } = await getAgentUserId(agent);

      try {
        // 1. Reply to comments
        const replied = await replyToComments(agent, agentUserId);

        // 2. Engage with feed (likes + comments)
        const { liked, commented } = await engageWithFeed(agent, agentUserId);

        // 3. Post if interval has passed
        let posted = false;
        const now = Date.now();
        const lastPost = agent.lastPostedAt?.getTime() || 0;
        const intervalMs = template.intervalMin * 60 * 1000;

        if (now - lastPost >= intervalMs) {
          posted = await createPost(agent, agentUserId, agentWallet, template);
        }

        results.push({
          agent: agent.ens,
          replied,
          liked,
          commented,
          posted,
        });
      } catch (e) {
        console.error(`Agent ${agent.ens} error:`, e instanceof Error ? e.message : e);
        results.push({ agent: agent.ens, error: true });
      }
    }

    return NextResponse.json({ message: `Processed ${agents.length} agents`, actions: results });
  } catch (error) {
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
