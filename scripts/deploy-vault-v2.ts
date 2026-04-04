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

  const USDC = process.env.USDC_ADDRESS || "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";
  const TREASURY = process.env.PROTOCOL_TREASURY || deployer.address;

  console.log("\nDeploying AgentFiVaultV2...");
  const Vault = await ethers.getContractFactory("AgentFiVaultV2");
  const vault = await Vault.deploy(USDC, TREASURY, deployer.address);
  await vault.waitForDeployment();
  const address = await vault.getAddress();
  console.log("AgentFiVaultV2:", address);

  const outPath = join(__dirname, "../deployments/worldchain-mainnet.json");
  const existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  existing.contracts.AgentFiVaultV2 = address;
  existing.timestamp = new Date().toISOString();
  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
  console.log("Saved!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
