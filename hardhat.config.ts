import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    worldchainTestnet: {
      url: "https://worldchain-sepolia.g.alchemy.com/public",
      chainId: 4801,
      accounts: [BACKEND_PRIVATE_KEY],
    },
    hardhat: {
      chainId: 31337,
    },
  },
};

export default config;
