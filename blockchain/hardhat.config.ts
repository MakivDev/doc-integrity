import { HardhatUserConfig } from "hardhat/config";
import toolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

dotenv.config();

let privateKey = process.env.PRIVATE_KEY || "";
if (privateKey && !privateKey.startsWith("0x")) {
  privateKey = "0x" + privateKey;
}

const config: HardhatUserConfig = {
  plugins: [toolbox],
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      url: "https://ethereum-sepolia-rpc.publicnode.com", 
      accounts: privateKey ? [privateKey] : [],
    },
  },
};

export default config;
