"use client";

import { useWeb3 } from "@/app/providers/Web3Provider";
import { useI18n } from "@/app/providers/I18nProvider";

export default function WalletButton() {
  const { account, balance, isConnecting, isCorrectNetwork, connectWallet, error } = useWeb3();
  const { t } = useI18n();

  if (!account) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="btn btn-primary"
          style={{ minWidth: '220px', justifyContent: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          {isConnecting ? t.wallet.connecting : t.wallet.connect}
        </button>
        {error && <span className="text-error" style={{ fontSize: '0.75rem' }}>{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3" style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <div className="relative flex h-3 w-3">
            {isCorrectNetwork ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--success)' }}></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--error)' }} title={t.wallet.wrongNetwork}></span>
            )}
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {balance ? `${Number(balance).toFixed(4)} ${t.common.eth}` : "0.0000 ETH"} • {t.common.sepolia}
        </div>
      </div>
    </div>
  );
}
