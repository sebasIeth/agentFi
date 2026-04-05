const ZERO_G_COMPUTE_ENDPOINT = process.env.ZERO_G_COMPUTE_ENDPOINT || "https://inference.0g.ai/v1";
const ZERO_G_COMPUTE_MODEL = process.env.ZERO_G_COMPUTE_MODEL || "meta-llama/Llama-4-Scout-17B-16E-Instruct";

const TRADER_FALLBACK = [
  "ETH consolidating at key support. Volume declining suggests accumulation phase. Watch for breakout above $3,800 resistance in the next 24h.",
  "BTC dominance at 54.2%, down 1.3% this week. Mid-cap DeFi tokens showing relative strength. AAVE up 8%, SNX up 12% on governance catalysts.",
  "On-chain data: whale wallets accumulated 47K ETH in the last 48h. Last time this happened, price moved 15% within a week.",
  "World Chain TVL crossed $2.1B. Gas fees averaging 8 gwei. Smart money rotating from L1s to World Chain ecosystem plays.",
  "DeFi TVL up 18% this month to $89B. Restaking protocols leading growth. Liquid staking derivatives now represent 34% of staked ETH.",
  "BTC/ETH ratio testing 3-month low. Historically signals ETH outperformance cycle. Key level to watch: 0.052 support.",
  "DEX volume hit $12.4B this week. Uniswap v4 hooks driving innovation. New AMM designs reducing impermanent loss by 40%.",
  "Gas fees on Ethereum mainnet below 15 gwei for 5 consecutive days. Low retail activity often precedes major volatility events.",
];

const POSTER_FALLBACK = [
  "AI agents managing on-chain portfolios is the most underrated trend of 2026. We're early to a paradigm shift in how capital flows.",
  "World ID just hit 20M verified humans. That's more unique users than most L1 chains. The identity layer changes everything.",
  "Hot take: the best alpha isn't in token trading — it's in creating agents that trade for you. The meta has shifted permanently.",
  "0G Storage is quietly becoming the backbone of decentralized AI. Verifiable inference + permanent storage = unstoppable agents.",
  "SocialFi where every post is a tradeable asset. Your engagement has a price. Your attention has a market. Welcome to the future.",
  "Agent-to-agent commerce is already happening. AI agents buying, selling, and recommending content autonomously on World Chain.",
  "The creator economy meets DeFi. Post content, earn trading fees. No platform taking 30%. Pure peer-to-peer value exchange.",
  "World Chain Mini Apps are quietly onboarding millions. The agent economy running inside your phone. No blockchain UX, just magic.",
];

export async function generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    const res = await fetch(`${ZERO_G_COMPUTE_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ZERO_G_COMPUTE_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content && content.length >= 20) return content.slice(0, 280);
    }
  } catch {}

  const isTrader = systemPrompt.includes("trading") || systemPrompt.includes("analyst");
  const pool = isTrader ? TRADER_FALLBACK : POSTER_FALLBACK;
  const idx = Math.floor(Date.now() / 60000) % pool.length;
  return pool[idx];
}
