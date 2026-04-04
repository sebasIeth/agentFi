import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const worldchain = defineChain({
  id: 480,
  name: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://worldchain-mainnet.g.alchemy.com/public"] },
  },
});

export const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(process.env.WORLD_CHAIN_RPC || "https://worldchain-mainnet.g.alchemy.com/public"),
});

export function getBackendWallet() {
  if (!process.env.BACKEND_PRIVATE_KEY) throw new Error("BACKEND_PRIVATE_KEY not set");
  const account = privateKeyToAccount(process.env.BACKEND_PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: worldchain,
    transport: http(process.env.WORLD_CHAIN_RPC || "https://worldchain-mainnet.g.alchemy.com/public"),
  });
  return { account, client };
}

// Contract ABIs (minimal for reads/writes we need)
export const AGENT_REGISTRY_ABI = [
  { name: "registerAgent", type: "function", stateMutability: "nonpayable", inputs: [{ name: "humanId", type: "bytes32" }, { name: "agentWallet", type: "address" }, { name: "ensName", type: "string" }, { name: "templateType", type: "string" }], outputs: [] },
  { name: "isVerifiedAgent", type: "function", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "getAgent", type: "function", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }], outputs: [{ name: "", type: "tuple", components: [{ name: "humanId", type: "bytes32" }, { name: "ensName", type: "string" }, { name: "templateType", type: "string" }, { name: "active", type: "bool" }, { name: "registeredAt", type: "uint256" }] }] },
  { name: "getAgentCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const POST_FACTORY_ABI = [
  { name: "createPost", type: "function", stateMutability: "nonpayable", inputs: [{ name: "creator", type: "address" }, { name: "contentHash", type: "bytes32" }, { name: "ticker", type: "string" }], outputs: [{ type: "address" }] },
  { name: "getAllPosts", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { name: "getCreatorPosts", type: "function", stateMutability: "view", inputs: [{ name: "creator", type: "address" }], outputs: [{ type: "address[]" }] },
  { name: "getCoinByHash", type: "function", stateMutability: "view", inputs: [{ name: "contentHash", type: "bytes32" }], outputs: [{ type: "address" }] },
  { name: "getPostCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const POST_COIN_ABI = [
  { name: "getPrice", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getMarketCap", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getBuyQuote", type: "function", stateMutability: "view", inputs: [{ name: "usdcAmount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "getSellQuote", type: "function", stateMutability: "view", inputs: [{ name: "tokenAmount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "buy", type: "function", stateMutability: "nonpayable", inputs: [{ name: "usdcAmount", type: "uint256" }], outputs: [] },
  { name: "sell", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenAmount", type: "uint256" }], outputs: [] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "creator", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
] as const;

export const VAULT_ABI = [
  { name: "createPool", type: "function", stateMutability: "nonpayable", inputs: [{ name: "postId", type: "bytes32" }, { name: "creator", type: "address" }], outputs: [] },
  { name: "buy", type: "function", stateMutability: "nonpayable", inputs: [{ name: "postId", type: "bytes32" }, { name: "usdcAmount", type: "uint256" }, { name: "minTokensOut", type: "uint256" }], outputs: [] },
  { name: "sell", type: "function", stateMutability: "nonpayable", inputs: [{ name: "postId", type: "bytes32" }, { name: "tokenAmount", type: "uint256" }, { name: "minUsdcOut", type: "uint256" }], outputs: [] },
  { name: "getPrice", type: "function", stateMutability: "view", inputs: [{ name: "postId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { name: "getMarketCap", type: "function", stateMutability: "view", inputs: [{ name: "postId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { name: "getBuyQuote", type: "function", stateMutability: "view", inputs: [{ name: "postId", type: "bytes32" }, { name: "usdcAmount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "getSellQuote", type: "function", stateMutability: "view", inputs: [{ name: "postId", type: "bytes32" }, { name: "tokenAmount", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "postId", type: "bytes32" }, { name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "holderCount", type: "function", stateMutability: "view", inputs: [{ name: "postId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { name: "getPool", type: "function", stateMutability: "view", inputs: [{ name: "postId", type: "bytes32" }], outputs: [{ type: "tuple", components: [{ name: "creator", type: "address" }, { name: "totalSupply", type: "uint256" }, { name: "virtualUsdcReserve", type: "uint256" }, { name: "virtualTokenReserve", type: "uint256" }, { name: "realUsdcBalance", type: "uint256" }, { name: "active", type: "bool" }] }] },
  { name: "getPoolCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export function getContractAddresses() {
  return {
    agentRegistry: process.env.AGENT_REGISTRY_ADDRESS as `0x${string}` | undefined,
    postFactory: process.env.POST_FACTORY_ADDRESS as `0x${string}` | undefined,
    vault: (process.env.VAULT_ADDRESS || "0xC3D9Bc4715CcFEf6329a6DC9aD690B91FD5D348b") as `0x${string}`,
    usdc: (process.env.USDC_ADDRESS || "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1") as `0x${string}`,
  };
}
