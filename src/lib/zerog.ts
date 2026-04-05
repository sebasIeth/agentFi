import { MemData, Indexer } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";

const ZERO_G_RPC = process.env.ZERO_G_RPC || "https://evmrpc.0g.ai";
const ZERO_G_INDEXER = process.env.ZERO_G_INDEXER || "https://indexer-storage-turbo.0g.ai";

function getSigner() {
  const pk = process.env.BACKEND_PRIVATE_KEY;
  if (!pk) throw new Error("BACKEND_PRIVATE_KEY not set");
  const provider = new ethers.JsonRpcProvider(ZERO_G_RPC);
  return new ethers.Wallet(pk, provider);
}

export async function uploadToZeroG(content: string): Promise<string> {
  const signer = getSigner();
  const data = new TextEncoder().encode(content);
  const memData = new MemData(data);

  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) throw new Error(`0G merkle tree error: ${treeErr}`);

  const rootHash = tree!.rootHash() as string;

  const indexer = new Indexer(ZERO_G_INDEXER);

  try {
    const [, uploadErr] = await indexer.upload(memData, ZERO_G_RPC, signer);
    if (uploadErr) {
      const errStr = String(uploadErr);
      if (errStr.includes("revert") || errStr.includes("already") || errStr.includes("duplicate")) {
        return rootHash;
      }
      throw new Error(`0G upload error: ${uploadErr}`);
    }
  } catch (err) {
    const errStr = String(err);
    if (errStr.includes("revert") || errStr.includes("CALL_EXCEPTION")) {
      return rootHash;
    }
    throw err;
  }

  return rootHash;
}

export async function downloadFromZeroG(rootHash: string): Promise<string> {
  const indexer = new Indexer(ZERO_G_INDEXER);
  const outputPath = `/tmp/0g-${rootHash.slice(0, 16)}.txt`;

  const err = await indexer.download(rootHash, outputPath, true);
  if (err) throw new Error(`0G download error: ${err}`);

  const fs = await import("fs/promises");
  const content = await fs.readFile(outputPath, "utf-8");
  await fs.unlink(outputPath).catch(() => {});

  return content;
}
