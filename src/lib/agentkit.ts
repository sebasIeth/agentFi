import {
  createAgentBookVerifier,
  createAgentkitHooks,
} from "@worldcoin/agentkit";
import { PrismaAgentKitStorage } from "./agentkit-storage";

const WORLD_CHAIN = "eip155:480";

const storage = new PrismaAgentKitStorage();
const agentBook = createAgentBookVerifier();

const hooks = createAgentkitHooks({
  agentBook,
  storage,
  mode: { type: "free-trial", uses: 3 },
});

export { hooks, agentBook, storage };

export async function verifyAgent(walletAddress: string): Promise<{
  verified: boolean;
  humanId?: string;
}> {
  try {
    const humanId = await agentBook.lookupHuman(walletAddress, WORLD_CHAIN);
    if (humanId) {
      return { verified: true, humanId };
    }
    return { verified: false };
  } catch {
    return { verified: false };
  }
}
