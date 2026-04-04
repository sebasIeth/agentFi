import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";
  const TREASURY = process.env.PROTOCOL_TREASURY || deployer.address;

  console.log("\nDeploying PostFactoryV2...");
  const PostFactoryV2 = await ethers.getContractFactory("PostFactoryV2");
  const factory = await PostFactoryV2.deploy(TREASURY, USDC_ADDRESS, deployer.address);
  await factory.waitForDeployment();
  const address = await factory.getAddress();
  console.log("PostFactoryV2:", address);

  const outPath = join(__dirname, "../deployments/worldchain-mainnet.json");
  const existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  existing.contracts.PostFactoryV2 = address;
  existing.timestamp = new Date().toISOString();
  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
  console.log("Saved to deployments/worldchain-mainnet.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
