"use client";

import { useEffect, useState, useCallback } from "react";
import { useWeb3 } from "@/app/providers/Web3Provider";
import { useI18n } from "@/app/providers/I18nProvider";

interface DocInfo {
  hash: string;
  timestamp: number;
  active: boolean;
  filename?: string;
}

export default function DashboardPage() {
  const { account, contract, isCorrectNetwork } = useWeb3();
  const { t, locale } = useI18n();

  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const fetchDocuments = useCallback(async () => {
    if (!contract || !account) return;
    setLoading(true);
    
    try {
      // Отримуємо всі події реєстрації для поточного акаунта
      const filterReg = contract.filters.DocumentRegistered(null, null, account);
      const regEvents = await contract.queryFilter(filterReg);
      
      // Отримуємо всі події відкликання для поточного акаунта
      const filterRev = contract.filters.DocumentRevoked(null, null, account);
      const revEvents = await contract.queryFilter(filterRev);

      const revokedHashes = new Set(revEvents.map(e => (e as any).args[0]));

      const docs: DocInfo[] = regEvents.map((e: any) => ({
        hash: e.args[0],
        timestamp: Number(e.args[1]),
        active: !revokedHashes.has(e.args[0])
      }));

      // Сортуємо від нових до старих
      docs.sort((a, b) => b.timestamp - a.timestamp);
      
      // Fetch filenames
      if (docs.length > 0) {
        try {
          const hashes = docs.map(d => d.hash);
          const res = await fetch('/api/documents/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hashes })
          });
          if (res.ok) {
            const filenameMap = await res.json();
            docs.forEach(d => {
              if (filenameMap[d.hash]) {
                d.filename = filenameMap[d.hash];
              }
            });
          }
        } catch (dbErr) {
          console.error("Failed to fetch filenames", dbErr);
        }
      }

      setDocuments(docs);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    if (account && isCorrectNetwork) {
      fetchDocuments();
    }
  }, [account, isCorrectNetwork, fetchDocuments]);

  const handleRevoke = async (hash: string) => {
    if (!contract || !confirm(t.dashboard.revoke_confirm)) return;
    
    setRevoking(hash);
    try {
      const tx = await contract.revokeDocument(hash);
      await tx.wait();
      await fetchDocuments(); // Оновлюємо список
    } catch (err) {
      console.error(err);
      alert(t.common.error);
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString(locale === "uk" ? "uk-UA" : "en-US", {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (!account || !isCorrectNetwork) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center p-12 max-w-lg">
          <div className="text-5xl mb-6">📊</div>
          <h2 className="text-2xl font-bold mb-4">{t.dashboard.connect_warning}</h2>
          <p className="text-[var(--text-secondary)]">{t.wallet.noMetamask}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t.dashboard.title}</h1>
          <p className="text-[var(--text-secondary)]">{t.dashboard.subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-[var(--text-secondary)]">{t.dashboard.total}</div>
          <div className="text-2xl font-bold text-cyan">{documents.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan mx-auto mb-4"></div>
          <p>{t.common.loading}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-card text-center py-16">
          <div className="text-4xl mb-4 opacity-50">📄</div>
          <h3 className="text-xl font-bold mb-2">{t.dashboard.no_docs}</h3>
          <a href="/register" className="text-cyan hover:underline mt-4 inline-block">
            {t.dashboard.go_register}
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {documents.map((doc, idx) => (
            <div key={idx} className={`glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${!doc.active ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${doc.active ? 'bg-[var(--success)] text-[var(--bg-primary)]' : 'bg-[var(--warning)] text-[var(--bg-primary)]'}`}>
                    {doc.active ? t.dashboard.active : t.dashboard.revoked}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">{formatDate(doc.timestamp)}</span>
                </div>
                {doc.filename && (
                  <div className="font-bold text-lg mb-1 truncate" title={doc.filename}>
                    {doc.filename}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm text-cyan truncate" title={doc.hash}>
                    {doc.hash}
                  </div>
                  <button onClick={() => handleCopy(doc.hash, doc.hash)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 p-1">
                    {copiedField === doc.hash ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <a 
                  href={`/verify`} 
                  className="btn"
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  {t.nav.verify}
                </a>
                {doc.active && (
                  <button 
                    onClick={() => handleRevoke(doc.hash)}
                    disabled={revoking === doc.hash}
                    className="btn"
                    style={{ borderColor: 'var(--warning)', color: 'var(--warning)', minWidth: '130px', justifyContent: 'center' }}
                  >
                    {revoking === doc.hash ? t.dashboard.revoking : t.dashboard.revoke}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
