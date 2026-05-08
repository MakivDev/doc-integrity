"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther } from "ethers";
import { useWeb3 } from "@/app/providers/Web3Provider";
import { useI18n } from "@/app/providers/I18nProvider";

export default function AdminPage() {
  const { account, contract, isAdmin, isSuperAdmin } = useWeb3();
  const { t } = useI18n();

  const [balance, setBalance] = useState<string>("0");
  const [fee, setFee] = useState<string>("0");
  const [totalDocs, setTotalDocs] = useState<string>("0");
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [newFee, setNewFee] = useState("");
  const [newAdmin, setNewAdmin] = useState("");
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (contract && isAdmin) {
      fetchStats();
    }
  }, [contract, isAdmin]);

  const fetchStats = async () => {
    if (!contract) return;
    try {
      const [bal, currentFee, docs] = await Promise.all([
        contract.getContractBalance(),
        contract.registrationFee(),
        contract.totalDocuments()
      ]);
      setBalance(formatEther(bal));
      setFee(formatEther(currentFee));
      setTotalDocs(docs.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !withdrawAmount) return;
    setProcessing(true);
    try {
      const amountStr = withdrawAmount.toString().replace(',', '.').trim();
      const tx = await contract.withdraw(parseEther(amountStr));
      await tx.wait();
      alert(t.admin.withdraw_success);
      setWithdrawAmount("");
      fetchStats();
    } catch (err: any) {
      console.error("Withdraw Error:", err);
      // ethers v6 returns specific error objects, we try to extract the most readable part
      alert(err.reason || err.shortMessage || err.message || t.common.error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetFee = async () => {
    if (!contract || !newFee) return;
    setProcessing(true);
    try {
      const feeStr = newFee.toString().replace(',', '.').trim();
      const tx = await contract.setFee(parseEther(feeStr));
      await tx.wait();
      alert(t.admin.fee_success);
      setNewFee("");
      fetchStats();
    } catch (err: any) {
      console.error("SetFee Error:", err);
      alert(err.reason || err.shortMessage || err.message || t.common.error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!contract || !newAdmin || !isSuperAdmin) return;
    setProcessing(true);
    try {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      const tx = await contract.grantRole(ADMIN_ROLE, newAdmin);
      await tx.wait();
      alert(t.common.success);
      setNewAdmin("");
    } catch (err) {
      console.error(err);
      alert(t.common.error);
    } finally {
      setProcessing(false);
    }
  };

  if (!account || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="glass-card text-center p-12 max-w-lg border-[var(--error)]">
          <div className="text-5xl mb-6">🛑</div>
          <h2 className="text-2xl font-bold mb-4">{t.admin.no_access}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t.admin.title}</h1>
        <p className="text-[var(--text-secondary)]">{t.admin.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card text-center">
          <div className="text-sm text-[var(--text-secondary)] mb-2">{t.admin.stats_balance}</div>
          <div className="text-3xl font-bold text-success">{Number(balance).toFixed(4)} ETH</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-sm text-[var(--text-secondary)] mb-2">{t.admin.stats_docs}</div>
          <div className="text-3xl font-bold text-cyan">{totalDocs}</div>
        </div>
        <div className="glass-card text-center">
          <div className="text-sm text-[var(--text-secondary)] mb-2">{t.admin.stats_fee}</div>
          <div className="text-3xl font-bold text-magenta">{Number(fee).toFixed(4)} ETH</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card">
          <h3 className="text-xl font-bold mb-4">{t.admin.withdraw}</h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              step="0.001"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 text-white focus:border-cyan outline-none"
            />
            <button 
              className="btn btn-primary"
              onClick={handleWithdraw}
              disabled={processing || !withdrawAmount}
              style={{ minWidth: '160px', justifyContent: 'center' }}
            >
              {t.admin.withdraw}
            </button>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="text-xl font-bold mb-4">{t.admin.fee_update}</h3>
          <div className="flex gap-2">
            <input 
              type="number" 
              step="0.0001"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              placeholder="0.001"
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 text-white focus:border-magenta outline-none"
            />
            <button 
              className="btn"
              style={{ border: '1px solid var(--accent-magenta)', minWidth: '160px', justifyContent: 'center' }}
              onClick={handleSetFee}
              disabled={processing || !newFee}
            >
              {t.admin.fee_update}
            </button>
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="glass-card border-[var(--accent-indigo)]">
          <h3 className="text-xl font-bold mb-4">{t.admin.admins_title}</h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newAdmin}
              onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 text-white focus:border-indigo-500 outline-none"
            />
            <button 
              className="btn"
              style={{ border: '1px solid var(--accent-indigo)', minWidth: '160px', justifyContent: 'center' }}
              onClick={handleAddAdmin}
              disabled={processing || !newAdmin}
            >
              {t.admin.admins_add}
            </button>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Суперадмін може додавати нових адміністраторів. Адміністратори можуть виводити кошти та змінювати комісію.
          </p>
        </div>
      )}
    </div>
  );
}
