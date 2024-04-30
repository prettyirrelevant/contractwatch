import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import { config as envConfig } from "dotenv";

envConfig()

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    testnet: {
      url: process.env.SCROLL_TESTNET_RPC,
      accounts: [String(PRIVATE_KEY)],
      allowUnlimitedContractSize: true
    },
  },
  etherscan: {
    apiKey: process.env.SCROLL_SCAN_API_KEY,
    customChains: [
      {
        network: "testnet",
        chainId: 534351,
        urls: {
          apiURL: "https://api-sepolia.scrollscan.com/api",
          browserURL: "https://sepolia.scrollscan.com/"
        }
      }
    ]
  },
};

export default config;
