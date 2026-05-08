"use client";

import { useState, useCallback, useEffect } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import type { Signer } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX } from "@/app/lib/contract";

// Розширення типу window для MetaMask
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface Web3State {
  account: string | null;
  balance: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
  contract: Contract | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
}

export function useWeb3() {
  const [state, setState] = useState<Web3State>({
    account: null,
    balance: null,
    provider: null,
    signer: null,
    contract: null,
    isConnecting: false,
    isCorrectNetwork: false,
    error: null,
  });

  // Перевірка та переключення мережі на Sepolia
  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (switchError: unknown) {
      // Якщо мережа не додана — додаємо
      if (typeof switchError === "object" && switchError !== null && "code" in switchError && (switchError as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID_HEX,
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
  }, []);

  // Підключення гаманця MetaMask
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setState((prev) => ({ ...prev, error: "MetaMask не встановлений. Будь ласка, встановіть MetaMask." }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Запит дозволу на підключення акаунтів
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("Не вдалося отримати акаунти");
      }

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const isCorrectNetwork = Number(network.chainId) === SEPOLIA_CHAIN_ID;

      if (!isCorrectNetwork) {
        await switchToSepolia();
        const newProvider = new BrowserProvider(window.ethereum);
        const signer = await newProvider.getSigner();
        const balance = await newProvider.getBalance(accounts[0]);
        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        setState({
          account: accounts[0],
          balance: formatEther(balance),
          provider: newProvider,
          signer,
          contract,
          isConnecting: false,
          isCorrectNetwork: true,
          error: null,
        });
        return;
      }

      const signer = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setState({
        account: accounts[0],
        balance: formatEther(balance),
        provider,
        signer,
        contract,
        isConnecting: false,
        isCorrectNetwork: true,
        error: null,
      });
    } catch (err: unknown) {
      let message = "Помилка підключення гаманця";
      if (typeof err === "object" && err !== null && "code" in err) {
        const code = (err as { code: number }).code;
        if (code === 4001) {
          message = "Підключення відхилено користувачем";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
    }
  }, [switchToSepolia]);

  // Слухаємо зміну акаунтів
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        // Користувач відключив акаунт
        setState({
          account: null,
          balance: null,
          provider: null,
          signer: null,
          contract: null,
          isConnecting: false,
          isCorrectNetwork: false,
          error: null,
        });
      } else if (state.provider) {
        const balance = await state.provider.getBalance(accounts[0]);
        const signer = await state.provider.getSigner();
        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setState((prev) => ({
          ...prev,
          account: accounts[0],
          balance: formatEther(balance),
          signer,
          contract,
        }));
      }
    };

    const handleChainChanged = () => {
      // При зміні мережі перезавантажуємо сторінку (рекомендація MetaMask)
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [state.provider]);

  return {
    ...state,
    connectWallet,
    switchToSepolia,
  };
}
