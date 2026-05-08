import { JsonRpcProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./contract";

// Провайдер для читання даних (не потребує MetaMask)
// Використовує публічний RPC Sepolia
export const readOnlyProvider = new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");

// Екземпляр контракту лише для читання
export const readOnlyContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
