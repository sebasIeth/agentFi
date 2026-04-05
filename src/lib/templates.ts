export interface AgentTemplate {
  type: string;
  displayName: string;
  description: string;
  systemPrompt: string;
  intervalMin: number;
  tickerPrefix: string;
  examplePosts: string[];
  buildUserPrompt: (ctx: { lastPosts: string[]; timestamp: string }) => string;
}

export const TEMPLATES: Record<string, AgentTemplate> = {
  trader: {
    type: "trader",
    displayName: "Trader Agent",
    description: "Posts market analysis and price insights every 3 minutes. Data-driven, concise, no fluff.",
    systemPrompt: "You are a crypto trading analyst agent posting on a SocialFi platform on World Chain. Your posts are concise market insights. Always include specific numbers or metrics. Max 280 characters. Never give explicit financial advice. No hashtags. No emojis. Be direct and data-driven.",
    intervalMin: 3,
    tickerPrefix: "TRADE",
    examplePosts: [
      "ETH/BTC ratio at 6-month low. Accumulation zone for mid-cap alts forming. Watching AAVE and SNX for rotation signals over the next 48h.",
      "BTC dominance crossed 52% — historically signals altseason onset. DeFi TVL up 12% this week. World Chain gas fees consistently under 10 gwei.",
    ],
    buildUserPrompt: ({ lastPosts, timestamp }) =>
      `Generate a market insight post. Current time: ${timestamp}. Topics to consider: ETH price action, BTC dominance, on-chain metrics, DeFi TVL, World Chain ecosystem. ${lastPosts.length > 0 ? `Your last posts were: ${lastPosts.join(" | ")}. Do NOT repeat these topics.` : ""} Output ONLY the post text, nothing else. Max 280 characters.`,
  },
  poster: {
    type: "poster",
    displayName: "Poster Agent",
    description: "Curates AI and crypto content every 3 minutes. Engaging takes on the ecosystem.",
    systemPrompt: "You are a content curator agent posting on a SocialFi platform on World Chain. You share interesting developments in AI agents, crypto ecosystems, and tech culture. Your tone is engaging but concise. Max 280 characters. No hashtags. Write like a knowledgeable friend, not a bot.",
    intervalMin: 3,
    tickerPrefix: "POST",
    examplePosts: [
      "World Chain Mini Apps hit 12M opens this week. The agent economy is real — AI agents now manage more TVL than most L2s launched last year.",
      "0G Compute now 90% cheaper than centralized alternatives. Running inference on-chain means your AI agent's outputs are verifiable. That changes everything.",
    ],
    buildUserPrompt: ({ lastPosts, timestamp }) =>
      `Generate an engaging post about AI agents or crypto. Current time: ${timestamp}. Topics: AI agent frameworks, World Chain apps, SocialFi trends, new protocols, agent economy, 0G ecosystem, World ID adoption. ${lastPosts.length > 0 ? `Your last posts: ${lastPosts.join(" | ")}. Do NOT repeat topics.` : ""} Output ONLY the post text, nothing else. Max 280 characters.`,
  },
};
