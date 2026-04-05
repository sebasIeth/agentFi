import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

const ZERO_G_RPC = process.env.ZERO_G_RPC || "https://evmrpc.0g.ai";

const PROVIDER_CHAIN = [
  "0x1B3AAef3ae5050EEE04ea38cD4B087472BD85EB0", // DeepSeek v3 (primary)
];

type Broker = Awaited<ReturnType<typeof createZGComputeNetworkBroker>>;
let brokerInstance: Broker | null = null;
let brokerInitPromise: Promise<Broker> | null = null;

async function getBroker(): Promise<Broker> {
  if (brokerInstance) return brokerInstance;
  if (brokerInitPromise) return brokerInitPromise;

  brokerInitPromise = (async () => {
    const pk = process.env.BACKEND_PRIVATE_KEY;
    if (!pk) throw new Error("BACKEND_PRIVATE_KEY not set");
    const provider = new ethers.JsonRpcProvider(ZERO_G_RPC);
    const wallet = new ethers.Wallet(pk, provider);
    brokerInstance = await createZGComputeNetworkBroker(wallet);
    return brokerInstance;
  })();

  return brokerInitPromise;
}

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
  // Try each provider in chain
  for (const providerAddr of PROVIDER_CHAIN) {
    try {
      const broker = await getBroker();
      const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddr);
      const headers = await broker.inference.getRequestHeaders(providerAddr);

      const res = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.8,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (res.ok) {
        const data = await res.json();
        const msg = data.choices?.[0]?.message;
        const content = (msg?.content || msg?.reasoning_content || "").trim();
        if (content && content.length >= 20) return content.slice(0, 500);
        console.error("0G Compute: empty response from", model);
        continue;
      } else if (res.status === 429) {
        console.error("0G Compute: 429 on", model, "trying next...");
        continue;
      } else {
        console.error("0G Compute: status", res.status, "on", model);
        continue;
      }
    } catch (e) {
      console.error("0G Compute error:", e instanceof Error ? e.message : e);
      continue;
    }
  }

  const isTrader = systemPrompt.includes("trading") || systemPrompt.includes("analyst");
  const pool = isTrader ? TRADER_FALLBACK : POSTER_FALLBACK;
  const idx = Math.floor(Date.now() / 60000) % pool.length;
  return pool[idx];
}

const IMAGE_PROVIDER = "0xE29a72c7629815Eb480aE5b1F2dfA06f06cdF974";

export async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    const broker = await getBroker();
    const { endpoint, model } = await broker.inference.getServiceMetadata(IMAGE_PROVIDER);
    const headers = await broker.inference.getRequestHeaders(IMAGE_PROVIDER);

    const res = await fetch(`${endpoint}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: "512x512",
        response_format: "b64_json",
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (res.ok) {
      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json;
      if (b64) return Buffer.from(b64, "base64");
    } else {
      console.error("0G Image: status", res.status);
    }
  } catch (e) {
    console.error("0G Image error:", e instanceof Error ? e.message : e);
  }
  return null;
}
