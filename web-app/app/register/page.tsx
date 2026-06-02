"use client";

import { useState, useRef, useEffect } from "react";
import { formatEther } from "ethers";
import { useWeb3 } from "@/app/providers/Web3Provider";
import { useI18n } from "@/app/providers/I18nProvider";
import { hashFile } from "@/app/lib/hash";

type Status = "idle" | "hashing" | "ready" | "pending" | "success" | "error";

export default function RegisterPage() {
  const { account, contract, isCorrectNetwork } = useWeb3();
  const { t, locale } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fee, setFee] = useState<bigint | null>(null);

  // Отримання поточної комісії з контракту
  useEffect(() => {
    if (contract) {
      contract.registrationFee()
        .then((f: bigint) => setFee(f))
        .catch(console.error);
    }
  }, [contract]);

  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'csv'];

  const handleFileChange = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setStatus("error");
      setErrorMessage(locale === "uk" ? "Помилка: дозволені лише документи (PDF, DOC, TXT тощо)." : "Error: only document files are allowed (PDF, DOC, TXT, etc.).");
      return;
    }

    setFile(selectedFile);
    setStatus("hashing");
    setErrorMessage("");

    try {
      const computedHash = await hashFile(selectedFile);
      setHash(computedHash);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setErrorMessage(t.register.err_generic);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const registerOnBlockchain = async () => {
    if (!contract || !hash || !file || fee === null) return;
    setStatus("pending");
    setErrorMessage("");

    try {
      const tx = await contract.registerDocument(hash, { value: fee });
      await tx.wait();

      try {
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash: hash, filename: file.name })
        });
      } catch (dbErr) {
        console.error("Failed to save filename to DB", dbErr);
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      if (err.message?.includes("Document already registered") || err.reason?.includes("already registered")) {
        setErrorMessage(t.register.err_already);
      } else if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setErrorMessage(t.register.err_rejected);
      } else if (err.message?.includes("Insufficient funds") || err.message?.includes("insufficient funds")) {
        setErrorMessage(t.register.err_fee);
      } else {
        setErrorMessage(t.register.err_generic);
        console.error(err);
      }
    }
  };

  if (!account || !isCorrectNetwork) {
    return (
      <div className="flex flex-col items-center justify-center w-full text-center min-h-[80vh] pt-12">
        <div className="glass-card flex flex-col items-center justify-center mx-auto card-padding-adaptive max-w-lg w-full">
          <div className="text-5xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold mb-4">{t.register.connect_warning}</h2>
          <p className="text-[var(--text-secondary)]">{t.wallet.noMetamask}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center w-full items-center relative text-center page-wrapper-adaptive">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -z-10" />

      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center px-4">
        <div className="text-center w-full flex flex-col items-center hero-margin-adaptive">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-indigo-200 mb-6">
            {t.register.title}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            {t.register.subtitle}
          </p>
        </div>

        <div className="bg-[var(--bg-card)]/80 backdrop-blur-3xl rounded-[24px] md:rounded-[40px] border border-white/10 shadow-2xl w-full flex flex-col items-center card-padding-adaptive">
          {status === "idle" && (
            <div 
              className="relative overflow-hidden group w-full border-2 border-dashed border-white/20 rounded-[20px] md:rounded-[32px] flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer hover:border-cyan hover:bg-cyan/5 hover:shadow-[0_0_50px_rgba(0,240,255,0.15)] mx-auto dropzone-padding-adaptive"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 w-full flex flex-col items-center gap-6 justify-center">
                <div className="w-24 h-24 bg-[var(--bg-primary)] border border-white/10 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 group-hover:border-cyan/30 transition-all duration-500 shadow-2xl mx-auto">
                  <svg className="w-10 h-10 text-[var(--text-secondary)] group-hover:text-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan transition-colors text-center">{t.register.dropzone}</h3>
                <p className="text-[var(--text-secondary)] font-medium max-w-sm mx-auto text-center">{t.register.dropzone_hint}</p>
                
                <div className="mt-8 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/70 mx-auto">
                  <span className="w-2 h-2 rounded-full bg-cyan animate-pulse"></span>
                  DOC, PDF, TXT
                </div>
              </div>

              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.csv"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </div>
          )}

          {status === "hashing" && (
            <div className="text-center flex flex-col items-center justify-center w-full py-12 md:py-24">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-t-4 border-cyan rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-4 border-indigo-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🔐</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 text-center">{t.register.hashing}</h3>
              <p className="text-[var(--text-secondary)] text-center">Виконується локальне хешування SHA-256...</p>
            </div>
          )}
          {status === "error" && !file && (
            <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-[var(--error)]/30 flex flex-col items-center justify-center shadow-inner text-center relative overflow-hidden card-padding-adaptive">
              <div className="text-6xl mb-6 relative z-10 animate-[pulse_1.5s_ease-in-out_infinite]">⚠️</div>
              <h3 className="text-3xl font-extrabold text-white mb-4 relative z-10">{locale === "uk" ? "Помилка формату" : "Format Error"}</h3>
              <p className="text-[var(--text-secondary)] text-xl max-w-md mx-auto relative z-10 leading-relaxed">{errorMessage}</p>
              <div className="flex justify-center w-full pt-8">
                <button 
                  className="px-12 py-5 rounded-2xl font-bold text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all text-lg" 
                  onClick={() => {
                    setStatus("idle");
                    setErrorMessage("");
                  }}
                >
                  {t.common.back}
                </button>
              </div>
            </div>
          )}
          {(status === "ready" || status === "pending" || (status === "error" && file)) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', alignItems: 'center' }}>
              <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-center shadow-inner group text-center md:text-left box-padding-adaptive">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl text-indigo-400 group-hover:scale-105 transition-transform mx-auto md:mx-0">
                    📄
                  </div>
                  <div className="flex flex-col items-center md:items-start">
                    <div className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase mb-2">Обраний файл</div>
                    <div className="font-bold text-2xl text-white truncate max-w-[250px] md:max-w-md text-center md:text-left">{file?.name}</div>
                    <div className="text-base text-[var(--text-secondary)] mt-1">{(file?.size || 0) / 1024 > 1024 ? ((file?.size || 0) / 1024 / 1024).toFixed(2) + ' MB' : ((file?.size || 0) / 1024).toFixed(2) + ' KB'}</div>
                  </div>
                </div>
              </div>

              {fee !== null && (
                <div className="bg-gradient-to-r from-magenta/10 to-transparent w-full rounded-3xl border border-magenta/20 flex flex-col md:flex-row items-center justify-center relative overflow-hidden text-center md:text-left box-padding-adaptive">
                  <div className="absolute right-0 top-0 w-48 h-48 bg-magenta/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-magenta/20 flex items-center justify-center text-2xl border border-magenta/30 mx-auto md:mx-0">
                      💎
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                      <div className="text-xs font-bold tracking-[0.2em] uppercase text-magenta/80 mb-2">{t.register.fee_label}</div>
                      <div className="font-mono font-extrabold text-3xl text-white drop-shadow-[0_0_15px_rgba(255,0,170,0.4)]">{formatEther(fee)} <span className="text-magenta">ETH</span></div>
                    </div>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="bg-[var(--error)]/10 p-6 w-full rounded-3xl border border-[var(--error)]/30 flex flex-col md:flex-row items-center justify-center gap-5 animate-[pulse_1s_ease-in-out_1] text-center md:text-left" style={{ marginTop: '1rem' }}>
                  <div className="w-10 h-10 rounded-full bg-[var(--error)]/20 flex items-center justify-center text-[var(--error)] shrink-0 mx-auto md:mx-0">⚠️</div>
                  <div className="flex flex-col items-center md:items-start">
                    <h4 className="font-bold text-xl text-[var(--error)] mb-1">Помилка реєстрації</h4>
                    <p className="text-[var(--error)]/80 text-base font-medium">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full pt-8">
                <button 
                  className="px-10 py-5 rounded-2xl font-bold text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                  onClick={() => {
                    setFile(null);
                    setHash("");
                    setStatus("idle");
                  }}
                  disabled={status === "pending"}
                >
                  {t.common.cancel}
                </button>
                <button 
                  className="px-12 py-5 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-[0_10px_30px_rgba(0,240,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:pointer-events-none"
                  onClick={registerOnBlockchain}
                  disabled={status === "pending"}
                >
                  {status === "pending" ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Підтвердження в MetaMask...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {t.register.btn_register}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center relative flex flex-col items-center justify-center w-full py-8 md:py-16">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--success)]/20 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[var(--success)] to-emerald-700 rounded-full flex items-center justify-center text-white text-5xl shadow-[0_0_30px_rgba(16,185,129,0.4)] mb-8 animate-[bounce_1s_ease-in-out_1]">
                ✓
              </div>
              
              <h3 className="text-3xl font-extrabold text-white mb-4 text-center">{t.register.success}</h3>
              <p className="text-[var(--text-secondary)] text-lg mb-10 max-w-md mx-auto text-center">
                Ваш документ успішно захешовано. Цей доказ назавжди записаний у блокчейн Ethereum і не може бути підроблений.
              </p>

              <button 
                className="px-8 py-4 rounded-xl font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all mx-auto"
                onClick={() => setStatus("idle")}
              >
                {t.common.back}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}