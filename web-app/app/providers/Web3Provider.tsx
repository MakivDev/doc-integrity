"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import type { Signer } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX } from "@/app/lib/contract";
import { useI18n } from "@/app/providers/I18nProvider";

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
  isAdmin: boolean;
  isSuperAdmin: boolean;
  error: string | null;
}

interface Web3ContextType extends Web3State {
  connectWallet: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  balance: null,
  provider: null,
  signer: null,
  contract: null,
  isConnecting: false,
  isCorrectNetwork: false,
  isAdmin: false,
  isSuperAdmin: false,
  error: null,
  connectWallet: async () => {},
  switchToSepolia: async () => {},
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  const [state, setState] = useState<Web3State>({
    account: null,
    balance: null,
    provider: null,
    signer: null,
    contract: null,
    isConnecting: false,
    isCorrectNetwork: false,
    isAdmin: false,
    isSuperAdmin: false,
    error: null,
  });

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (switchError: unknown) {
      if (typeof switchError === "object" && switchError !== null && "code" in switchError && (switchError as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
      }
    }
  }, []);

  const checkAdminStatus = useCallback(async (contract: Contract, account: string) => {
    try {
      const [adminStatus, superAdminStatus] = await Promise.all([
        contract.isAdmin(account),
        contract.isSuperAdmin(account),
      ]);
      return { isAdmin: adminStatus, isSuperAdmin: superAdminStatus };
    } catch {
      return { isAdmin: false, isSuperAdmin: false };
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setState((prev) => ({ ...prev, error: t.wallet.noMetamask }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.length) throw new Error("Не вдалося отримати акаунти");

      let provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const isCorrectNetwork = Number(network.chainId) === SEPOLIA_CHAIN_ID;

      if (!isCorrectNetwork) {
        await switchToSepolia();
        provider = new BrowserProvider(window.ethereum);
      }

      const signer = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const { isAdmin, isSuperAdmin } = await checkAdminStatus(contract, accounts[0]);

      setState({
        account: accounts[0],
        balance: formatEther(balance),
        provider,
        signer,
        contract,
        isConnecting: false,
        isCorrectNetwork: true,
        isAdmin,
        isSuperAdmin,
        error: null,
      });
    } catch (err: unknown) {
      let message = t.common.error;
      if (typeof err === "object" && err !== null && "code" in err) {
        if ((err as { code: number }).code === 4001) message = t.wallet.rejected;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setState((prev) => ({ ...prev, isConnecting: false, error: message }));
    }
  }, [switchToSepolia, checkAdminStatus, t]);

  // Авто-підключення лише один раз при старті — [] щоб не було циклу
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then((accounts: unknown) => {
      const accs = accounts as string[];
      if (accs && accs.length > 0) {
        connectWallet();
      }
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Слухачі подій MetaMask (зміна акаунту / мережі)
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        setState({
          account: null, balance: null, provider: null, signer: null,
          contract: null, isConnecting: false, isCorrectNetwork: false,
          isAdmin: false, isSuperAdmin: false, error: null,
        });
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet]);

  return (
    <Web3Context.Provider value={{ ...state, connectWallet, switchToSepolia }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}