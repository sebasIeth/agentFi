import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";
  const TREASURY = process.env.PROTOCOL_TREASURY || deployer.address;

  // 1. Deploy AgentRegistry
  console.log("\n1. Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy(deployer.address);
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("   AgentRegistry:", agentRegistryAddress);

  // 2. Deploy PostFactory
  console.log("\n2. Deploying PostFactory...");
  const PostFactory = await ethers.getContractFactory("PostFactory");
  const postFactory = await PostFactory.deploy(
    agentRegistryAddress,
    TREASURY,
    USDC_ADDRESS,
    deployer.address
  );
  await postFactory.waitForDeployment();
  const postFactoryAddress = await postFactory.getAddress();
  console.log("   PostFactory:", postFactoryAddress);

  // Save deployment addresses
  const deployment = {
    network: "worldchain-testnet",
    chainId: 4801,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentRegistry: agentRegistryAddress,
      PostFactory: postFactoryAddress,
    },
    config: {
      USDC: USDC_ADDRESS,
      treasury: TREASURY,
    },
  };

  const outPath = path.join(__dirname, "../deployments/worldchain-testnet.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log("\nDeployment saved to:", outPath);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
