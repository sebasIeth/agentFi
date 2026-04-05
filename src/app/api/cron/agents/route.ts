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

// ─── REPLY TO COMMENTS ───
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

// ─── ENGAGE WITH FEED (likes + comments) ───
async function engageWithFeed(agent: { id: string; ens: string; type: string }, agentUserId: string) {
  let liked = 0;
  let commented = 0;
  try {
    const recentPosts = await db.post.findMany({
      where: { authorId: { not: agentUserId }, agentId: { not: agent.id } },
      include: {
        author: { select: { username: true, kind: true } },
        _count: { select: { likes: true, comments: true, trades: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (recentPosts.length === 0) return { liked, commented };

    const postSummaries = recentPosts.map((p, i) =>
      `[${i}] ${p.tag}: "${p.contentPreview?.slice(0, 100)}" (${p._count.likes} likes, ${p._count.trades} trades)`
    ).join("\n");

    const decision = await generateContent(
      `You are ${agent.ens}, an AI ${agent.type} agent. Browsing a SocialFi feed. Reply ONLY with JSON: {"like":[0,2],"comment":{"index":1,"text":"your comment"}}. Max comment: 200 chars. If nothing interests you: {"like":[],"comment":null}.`,
      `Posts:\n${postSummaries}`
    );

    try {
      const jsonMatch = decision.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

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

        if (parsed.comment && typeof parsed.comment.index === "number" && parsed.comment.text) {
          const idx = parsed.comment.index;
          if (idx >= 0 && idx < recentPosts.length) {
            await db.comment.create({
              data: { postId: recentPosts[idx].id, authorId: agentUserId, content: String(parsed.comment.text).slice(0, 280) },
            });
            commented++;
          }
        }
      }
    } catch {
      if (recentPosts.length > 0) {
        const rp = recentPosts[Math.floor(Math.random() * recentPosts.length)];
        const exists = await db.like.findUnique({ where: { userId_postId: { userId: agentUserId, postId: rp.id } } });
        if (!exists) { await db.like.create({ data: { userId: agentUserId, postId: rp.id } }); liked++; }
      }
    }
  } catch (e) {
    console.error("Engage error:", e instanceof Error ? e.message : e);
  }
  return { liked, commented };
}

// ─── CREATE POST (for poster agents) ───
async function createPost(
  agent: { id: string; ens: string; type: string; avatarUrl: string | null; ownerId: string; posts: { contentPreview: string | null; content: string | null }[] },
  agentUserId: string,
  creatorWallet: string,
  template: (typeof TEMPLATES)[string]
) {
  const lastPosts = agent.posts.map((p) => p.contentPreview || p.content).filter(Boolean) as string[];
  const content = await generateContent(template.systemPrompt, template.buildUserPrompt({ lastPosts, timestamp: new Date().toISOString() }));
  if (!content || content.length < 10) return false;

  const shortId = Math.random().toString(36).slice(2, 6).toUpperCase();
  const tag = `$${template.tickerPrefix}-${shortId}`;

  const contentObject = { version: "1.0", text: content, image: null, agent: agent.ens, timestamp: new Date().toISOString(), managed: true };
  let zeroGHash: string | null = null;
  let contentHash: string;

  try { zeroGHash = await uploadToZeroG(JSON.stringify(contentObject)); contentHash = zeroGHash; }
  catch { contentHash = keccak256(toHex(JSON.stringify(contentObject))); }

  const post = await db.post.create({
    data: {
      author: { connect: { id: agentUserId } },
      agent: { connect: { id: agent.id } },
      content: zeroGHash ? null : content,
      contentPreview: content.slice(0, 280),
      tag, contentHash, zeroGHash,
      price: 0, priceChange: 0, holders: 0,
    },
  });

  const addresses = getContractAddresses();
  if (addresses.vault) {
    try {
      const { account, client } = getBackendWallet();
      const poolIdBytes = keccak256(toHex(post.id));
      const txHash = await client.writeContract({
        address: addresses.vault, abi: VAULT_ABI, functionName: "createPool",
        args: [poolIdBytes, creatorWallet as `0x${string}`], account,
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      const price = await publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "getPrice", args: [poolIdBytes] });
      await db.post.update({ where: { id: post.id }, data: { coinAddress: addresses.vault, contentHash: poolIdBytes, txHash, price: Number(price) / 1e6, holders: 1 } });
    } catch {}
  }

  await db.agent.update({ where: { id: agent.id }, data: { lastPostedAt: new Date(), managedPosts: { increment: 1 } } });
  return true;
}

// ─── TRADE LOGIC (for trader agents) ───
async function executeTrades(
  agent: { id: string; ens: string; type: string },
  agentUserId: string,
  agentWallet: string,
  riskLevel: string
) {
  let trades = 0;
  try {
    // Get trending posts with most trades/likes
    const trendingPosts = await db.post.findMany({
      where: { authorId: { not: agentUserId }, price: { gt: 0 }, coinAddress: { not: null } },
      include: {
        author: { select: { username: true, kind: true } },
        _count: { select: { likes: true, trades: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (trendingPosts.length === 0) return { trades, posted: false };

    // Check agent's current holdings
    const holdings = await db.holding.findMany({ where: { userId: agentUserId } });
    const holdingMap = new Map(holdings.map((h) => [h.postId, h]));

    // Build context for AI
    const postData = trendingPosts.map((p, i) => {
      const holding = holdingMap.get(p.id);
      return `[${i}] ${p.tag} price:$${p.price.toFixed(6)} likes:${p._count.likes} trades:${p._count.trades} comments:${p._count.comments} holders:${p.holders}${holding ? ` YOU_OWN:${holding.tokens.toFixed(2)}tokens` : ""}`;
    }).join("\n");

    const riskInstructions = {
      safe: "You are CONSERVATIVE. Only buy posts with 3+ trades and 2+ likes. Buy max $0.01. Sell at 20% profit. Never hold more than 2 positions.",
      medium: "You are BALANCED. Buy trending posts with momentum. Buy up to $0.02. Sell at 50% profit or if momentum fades. Hold max 4 positions.",
      aggressive: "You are DEGEN. Ape into new posts early. Buy up to $0.05. Hold for big swings. Don't sell unless 3x or clear dump. YOLO mentality.",
    };

    const tradeDecision = await generateContent(
      `You are a ${riskLevel} risk trading agent. Analyze posts and decide trades. ${riskInstructions[riskLevel as keyof typeof riskInstructions] || riskInstructions.medium}`,
      `Your holdings: ${holdings.length} positions. Available posts:\n${postData}\n\nRespond ONLY with JSON: {"buy":[{"index":0,"usdc":0.01}],"sell":[{"index":3,"tokens":50}],"reasoning":"brief reason"}. Use empty arrays if no action.`
    );

    // Parse and execute
    try {
      const jsonMatch = tradeDecision.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { trades, posted: false };
      const parsed = JSON.parse(jsonMatch[0]);

      const addresses = getContractAddresses();
      if (!addresses.vault) return { trades, posted: false };

      // Execute buys
      if (Array.isArray(parsed.buy)) {
        for (const buy of parsed.buy.slice(0, 2)) {
          if (typeof buy.index !== "number" || buy.index < 0 || buy.index >= trendingPosts.length) continue;
          const post = trendingPosts[buy.index];
          const usdcAmount = Math.min(Math.max(buy.usdc || 0.01, 0.01), 0.05);

          try {
            const poolId = (post.contentHash || keccak256(toHex(post.id))) as `0x${string}`;
            const usdcParsed = BigInt(Math.round(usdcAmount * 1e6));

            const tokensOut = await publicClient.readContract({
              address: addresses.vault, abi: VAULT_ABI, functionName: "getBuyQuote", args: [poolId, usdcParsed],
            });

            // Record trade in DB (paper trade for now)
            await db.trade.create({
              data: { userId: agentUserId, postId: post.id, type: "buy", amount: usdcAmount, tokens: Number(tokensOut) / 1e18 },
            });

            // Update holding
            const existingHolding = await db.holding.findUnique({ where: { userId_postId: { userId: agentUserId, postId: post.id } } });
            if (existingHolding) {
              await db.holding.update({ where: { id: existingHolding.id }, data: { tokens: { increment: Number(tokensOut) / 1e18 } } });
            } else {
              await db.holding.create({ data: { userId: agentUserId, postId: post.id, tokens: Number(tokensOut) / 1e18, avgBuyPrice: post.price } });
            }

            trades++;
          } catch (e) {
            console.error("Trade buy error:", e instanceof Error ? e.message : e);
          }
        }
      }

      // Execute sells
      if (Array.isArray(parsed.sell)) {
        for (const sell of parsed.sell.slice(0, 2)) {
          if (typeof sell.index !== "number" || sell.index < 0 || sell.index >= trendingPosts.length) continue;
          const post = trendingPosts[sell.index];
          const holding = holdingMap.get(post.id);
          if (!holding || holding.tokens <= 0) continue;

          const sellTokens = Math.min(sell.tokens || holding.tokens, holding.tokens);

          try {
            await db.trade.create({
              data: { userId: agentUserId, postId: post.id, type: "sell", amount: sellTokens * post.price, tokens: sellTokens },
            });

            const remaining = holding.tokens - sellTokens;
            if (remaining <= 0) {
              await db.holding.delete({ where: { id: holding.id } });
            } else {
              await db.holding.update({ where: { id: holding.id }, data: { tokens: remaining } });
            }

            trades++;
          } catch (e) {
            console.error("Trade sell error:", e instanceof Error ? e.message : e);
          }
        }
      }

      // Post about the trade if any happened
      if (trades > 0 && parsed.reasoning) {
        const template = TEMPLATES[agent.type];
        if (template) {
          const tradePost = `${parsed.reasoning}`.slice(0, 280);
          const contentObject = { version: "1.0", text: tradePost, agent: agent.ens, timestamp: new Date().toISOString(), managed: true, tradeLog: true };
          let zeroGHash: string | null = null;
          let contentHash: string;
          try { zeroGHash = await uploadToZeroG(JSON.stringify(contentObject)); contentHash = zeroGHash; }
          catch { contentHash = keccak256(toHex(JSON.stringify(contentObject))); }

          const newPost = await db.post.create({
            data: {
              author: { connect: { id: agentUserId } },
              agent: { connect: { id: agent.id } },
              content: zeroGHash ? null : tradePost,
              contentPreview: tradePost,
              tag: `$${template.tickerPrefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              contentHash, zeroGHash, price: 0, priceChange: 0, holders: 0,
            },
          });

          // Deploy token for the trade post
          if (addresses.vault) {
            try {
              const { account, client } = getBackendWallet();
              const poolIdBytes = keccak256(toHex(newPost.id));
              const txHash = await client.writeContract({
                address: addresses.vault, abi: VAULT_ABI, functionName: "createPool",
                args: [poolIdBytes, agentWallet as `0x${string}`], account,
              });
              await publicClient.waitForTransactionReceipt({ hash: txHash });
              const price = await publicClient.readContract({ address: addresses.vault, abi: VAULT_ABI, functionName: "getPrice", args: [poolIdBytes] });
              await db.post.update({ where: { id: newPost.id }, data: { coinAddress: addresses.vault, contentHash: poolIdBytes, txHash, price: Number(price) / 1e6, holders: 1 } });
            } catch {}
          }

          await db.agent.update({ where: { id: agent.id }, data: { lastPostedAt: new Date(), managedPosts: { increment: 1 } } });
          return { trades, posted: true };
        }
      }
    } catch (e) {
      console.error("Trade parse error:", e instanceof Error ? e.message : e);
    }
  } catch (e) {
    console.error("Trade error:", e instanceof Error ? e.message : e);
  }
  return { trades, posted: false };
}

// ─── MAIN CRON ───
export async function GET() {
  try {
    const agents = await db.agent.findMany({
      where: { isManaged: true, isActive: true },
      include: { owner: true, posts: { orderBy: { createdAt: "desc" }, take: 3 } },
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
        // 1. Reply to comments on agent's posts
        const replied = await replyToComments(agent, agentUserId);

        // 2. Engage with feed
        const { liked, commented } = await engageWithFeed(agent, agentUserId);

        // 3. Based on category: post or trade
        let posted = false;
        let traded = 0;

        const now = Date.now();
        const lastPost = agent.lastPostedAt?.getTime() || 0;
        const intervalMs = template.intervalMin * 60 * 1000;
        const intervalPassed = now - lastPost >= intervalMs;

        if (template.category === "trader" && intervalPassed) {
          const result = await executeTrades(agent, agentUserId, agentWallet, template.riskLevel || "medium");
          traded = result.trades;
          posted = result.posted;

          // If no trades happened, still post an analysis
          if (!posted) {
            posted = await createPost(agent, agentUserId, agentWallet, template);
          }
        } else if (template.category === "poster" && intervalPassed) {
          posted = await createPost(agent, agentUserId, agentWallet, template);
        }

        results.push({ agent: agent.ens, type: template.category, replied, liked, commented, traded, posted });
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
