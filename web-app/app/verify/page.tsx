"use client";

import { useState, useRef } from "react";
import { useWeb3 } from "@/app/providers/Web3Provider";
import { useI18n } from "@/app/providers/I18nProvider";
import { readOnlyContract } from "@/app/lib/provider";
import { hashFile } from "@/app/lib/hash";

type Status = "idle" | "hashing" | "checking" | "found" | "not_found" | "revoked" | "error";
type VerifyMode = "file" | "hash";

interface VerifyResult {
  isRegistered: boolean;
  timestamp: bigint;
  author: string;
}

export default function VerifyPage() {
  const { t, locale } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<VerifyMode>("file");
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [inputHash, setInputHash] = useState<string>("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'csv'];

  const handleFileChange = async (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(locale === "uk" ? "Помилка: дозволені лише документи (PDF, DOC, TXT тощо)." : "Error: only document files are allowed (PDF, DOC, TXT, etc.).");
      setStatus("error");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setStatus("hashing");

    try {
      const computedHash = await hashFile(selectedFile);
      setHash(computedHash);
      setStatus("checking");
      await verifyOnBlockchain(computedHash);
    } catch (err) {
      setStatus("error");
      console.error(err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const verifyByHash = async () => {
    if (!inputHash || inputHash.length !== 66 || !inputHash.startsWith("0x")) {
      setStatus("error"); 
      return;
    }
    setHash(inputHash);
    setStatus("checking");
    await verifyOnBlockchain(inputHash);
  };

  const verifyOnBlockchain = async (docHash: string) => {
    try {
      setFilename(null);
      try {
        const res = await fetch(`/api/documents/${docHash}`);
        if (res.ok) {
          const dbData = await res.json();
          setFilename(dbData.filename);
        }
      } catch (err) {
        console.error("Failed to fetch filename", err);
      }

      const data: VerifyResult = await readOnlyContract.verifyDocument(docHash);
      setResult(data);

      if (data.isRegistered) {
        setStatus("found");
      } else {
        if (data.timestamp > BigInt(0)) {
          setStatus("revoked");
        } else {
          setStatus("not_found");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString(locale === "uk" ? "uk-UA" : "en-US", {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col justify-center w-full items-center relative text-center page-wrapper-adaptive">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan/10 rounded-full blur-[80px] pointer-events-none -z-10" />

      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center px-4">
        
        {/* Header */}
        <div className="text-center w-full flex flex-col items-center hero-margin-adaptive">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-indigo-200 mb-6">
            {t.verify.title}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            {t.verify.subtitle}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[var(--bg-card)]/80 backdrop-blur-3xl rounded-[24px] md:rounded-[40px] border border-white/10 shadow-2xl w-full flex flex-col items-center card-padding-adaptive">
          
          {/* Toggle Switch */}
          {status === "idle" && (
            <div className="flex w-full bg-[var(--bg-primary)] border border-white/5 rounded-[16px] sm:rounded-[24px] shadow-inner p-1 sm:p-2 mb-6 sm:mb-10">
              <button 
                className={`flex-1 py-3 sm:py-4 text-center rounded-[12px] sm:rounded-[18px] transition-all font-bold text-sm sm:text-lg ${mode === "file" ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-[0_4px_20px_rgba(0,240,255,0.25)]" : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"}`}
                onClick={() => setMode("file")}
              >
                {locale === "uk" ? "По файлу" : "By File"}
              </button>
              <button 
                className={`flex-1 py-3 sm:py-4 text-center rounded-[12px] sm:rounded-[18px] transition-all font-bold text-sm sm:text-lg ${mode === "hash" ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-[0_4px_20px_rgba(0,240,255,0.25)]" : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"}`}
                onClick={() => setMode("hash")}
              >
                {locale === "uk" ? "По хешу (Advanced)" : "By Hash (Advanced)"}
              </button>
            </div>
          )}

          {/* IDLE - File Mode */}
          {status === "idle" && mode === "file" && (
            <div 
              className="relative overflow-hidden group w-full border-2 border-dashed border-white/20 rounded-[20px] md:rounded-[32px] flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer hover:border-cyan hover:bg-cyan/5 hover:shadow-[0_0_50px_rgba(0,240,255,0.15)] mx-auto dropzone-padding-adaptive"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 w-full flex flex-col items-center gap-6 justify-center">
                <div className="w-24 h-24 bg-[var(--bg-primary)] border border-white/10 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 group-hover:border-cyan/30 transition-all duration-500 shadow-2xl mx-auto">
                  <svg className="w-12 h-12 text-[var(--text-secondary)] group-hover:text-cyan transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-white group-hover:text-cyan transition-colors text-center">{t.verify.dropzone}</h3>
                <p className="text-[var(--text-secondary)] text-lg font-medium max-w-sm mx-auto text-center">{t.verify.dropzone_hint}</p>
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

          {/* IDLE - Hash Mode */}
          {status === "idle" && mode === "hash" && (
            <div className="flex flex-col gap-6 w-full items-center">
              <div className="w-full text-left flex flex-col items-center">
                <label className="block text-sm font-bold tracking-wide uppercase text-[var(--text-secondary)] text-center mb-4">
                  {locale === "uk" ? "Введіть SHA-256 хеш документа (з префіксом 0x)" : "Enter SHA-256 document hash (with 0x prefix)"}
                </label>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 sm:pl-6 pointer-events-none">
                    <span className="text-[var(--text-secondary)] font-mono text-lg sm:text-xl">#</span>
                  </div>
                  <input 
                    type="text" 
                    value={inputHash}
                    onChange={(e) => setInputHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-[16px] sm:rounded-[24px] font-mono text-sm sm:text-lg focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all placeholder:text-white/20 shadow-inner text-center p-4 sm:p-6 pl-10 sm:pl-12"
                  />
                </div>
              </div>
              <button 
                className="w-full rounded-[16px] sm:rounded-[24px] font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-[0_10px_30px_rgba(0,240,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none text-base sm:text-lg p-4 sm:p-6"
                onClick={verifyByHash}
                disabled={!inputHash}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {locale === "uk" ? "Перевірити хеш" : "Verify Hash"}
              </button>
            </div>
          )}

          {/* HASHING */}
          {status === "hashing" && (
            <div className="text-center flex flex-col items-center justify-center w-full py-12 md:py-24">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-t-4 border-cyan rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-4 border-indigo-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🔍</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 text-center">{t.verify.hashing}</h3>
              <p className="text-[var(--text-secondary)] text-center text-lg">Виконується локальне хешування SHA-256...</p>
            </div>
          )}

          {/* CHECKING */}
          {status === "checking" && (
            <div className="text-center flex flex-col items-center justify-center w-full py-12 md:py-24">
              <div className="flex space-x-4 justify-center mx-auto" style={{ marginBottom: '2.5rem' }}>
                <div className="w-5 h-5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-5 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-5 h-5 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 text-center">{t.verify.checking}</h3>
              <p className="text-[var(--text-secondary)] text-center text-lg">Звернення до смарт-контракту в блокчейні Ethereum...</p>
            </div>
          )}

          {/* RESULTS */}
          {(status === "found" || status === "not_found" || status === "revoked" || status === "error") && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', alignItems: 'center' }}>
              
              {/* FOUND STATE */}
              {status === "found" && (
                <>
                  <div className="bg-gradient-to-r from-[var(--success)]/20 to-transparent w-full rounded-[24px] md:rounded-[32px] border border-[var(--success)]/30 flex flex-col md:flex-row items-center justify-center shadow-inner text-center md:text-left relative overflow-hidden box-padding-adaptive">
                    <div className="absolute left-0 top-0 w-48 h-48 bg-[var(--success)]/20 blur-[40px] rounded-full -translate-y-1/2 -translate-x-1/2"></div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10 w-full">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--success)]/20 border border-[var(--success)]/40 flex items-center justify-center text-3xl text-[var(--success)] mx-auto md:mx-0 shrink-0">
                        🛡️
                      </div>
                      <div className="flex flex-col items-center md:items-start w-full">
                        <div className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--success)] mb-2">{t.verify.found}</div>
                        <div className="font-bold text-xl sm:text-2xl text-white text-center md:text-left">{locale === "uk" ? "Документ є автентичним" : "Document is authentic"}</div>
                      </div>
                    </div>
                  </div>

                  {(filename || file?.name) && (
                    <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-inner group text-center relative overflow-hidden box-padding-adaptive">
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--success)]/0 via-[var(--success)]/5 to-[var(--success)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                      <div className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase mb-2">Назва документа</div>
                      <div className="font-bold text-xl sm:text-2xl text-white truncate max-w-[250px] md:max-w-md w-full relative z-10">{filename || file?.name}</div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-6">
                    <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-inner group text-center box-padding-adaptive">
                      <div className="flex items-center justify-center gap-2 mb-2 w-full">
                        <span className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase">{t.verify.date}</span>
                        <button onClick={() => handleCopy(formatDate(result!.timestamp), 'date')} className="text-[var(--text-secondary)] hover:text-white transition-colors p-1" title={locale === "uk" ? "Копіювати" : "Copy"}>
                          {copiedField === 'date' ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                      <div className="font-bold text-lg sm:text-2xl text-white w-full">{formatDate(result!.timestamp)}</div>
                    </div>

                    <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-inner group text-center box-padding-adaptive">
                      <div className="flex items-center justify-center gap-2 mb-2 w-full">
                        <span className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase">{t.verify.author}</span>
                        <button onClick={() => handleCopy(result!.author, 'author')} className="text-[var(--text-secondary)] hover:text-white transition-colors p-1" title={locale === "uk" ? "Копіювати" : "Copy"}>
                          {copiedField === 'author' ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                      <div className="font-mono text-sm sm:text-xl text-cyan truncate max-w-[200px] md:max-w-[250px] w-full" title={result!.author}>{result!.author}</div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-inner group text-center box-padding-adaptive">
                    <div className="flex items-center justify-center gap-2 mb-2 w-full">
                      <span className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase">{t.common.sha256}</span>
                      <button onClick={() => handleCopy(hash, 'hash')} className="text-[var(--text-secondary)] hover:text-white transition-colors p-1" title={locale === "uk" ? "Копіювати" : "Copy"}>
                        {copiedField === 'hash' ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    </div>
                    <div className="font-mono text-xs sm:text-lg text-indigo-200/70 break-all leading-relaxed w-full px-2">{hash}</div>
                  </div>
                </>
              )}

              {/* REVOKED STATE */}
              {status === "revoked" && (
                <>
                  <div className="bg-gradient-to-r from-[var(--warning)]/20 to-transparent w-full rounded-[24px] md:rounded-[32px] border border-[var(--warning)]/30 flex flex-col md:flex-row items-center justify-center shadow-inner text-center md:text-left relative overflow-hidden box-padding-adaptive">
                    <div className="absolute left-0 top-0 w-48 h-48 bg-[var(--warning)]/20 blur-[40px] rounded-full -translate-y-1/2 -translate-x-1/2"></div>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10 w-full">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--warning)]/20 border border-[var(--warning)]/40 flex items-center justify-center text-3xl text-[var(--warning)] mx-auto md:mx-0 shrink-0">
                        ⚠️
                      </div>
                      <div className="flex flex-col items-center md:items-start w-full">
                        <div className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--warning)] mb-2">{t.verify.revoked}</div>
                        <div className="font-bold text-xl sm:text-2xl text-white text-center md:text-left">{locale === "uk" ? "Документ відкликано" : "Document revoked"}</div>
                      </div>
                    </div>
                  </div>

                  {(filename || file?.name) && (
                    <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-inner text-center box-padding-adaptive">
                      <div className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase mb-2">Назва документа</div>
                      <div className="font-bold text-xl sm:text-2xl text-white truncate max-w-[250px] md:max-w-md w-full">{filename || file?.name}</div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row w-full gap-4 sm:gap-6">
                    <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-inner text-center box-padding-adaptive">
                      <div className="flex items-center justify-center gap-2 mb-2 w-full">
                        <span className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase">{t.verify.date}</span>
                        <button onClick={() => handleCopy(formatDate(result!.timestamp), 'dateRev')} className="text-[var(--text-secondary)] hover:text-white transition-colors p-1">
                          {copiedField === 'dateRev' ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                      <div className="font-bold text-lg sm:text-2xl text-white w-full">{formatDate(result!.timestamp)}</div>
                    </div>

                    <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-inner text-center box-padding-adaptive">
                      <div className="flex items-center justify-center gap-2 mb-2 w-full">
                        <span className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase">{t.verify.author}</span>
                        <button onClick={() => handleCopy(result!.author, 'authorRev')} className="text-[var(--text-secondary)] hover:text-white transition-colors p-1">
                          {copiedField === 'authorRev' ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                      <div className="font-mono text-sm sm:text-xl text-[var(--warning)] truncate max-w-[200px] md:max-w-[250px] w-full" title={result!.author}>{result!.author}</div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-white/5 flex flex-col items-center justify-center shadow-inner text-center box-padding-adaptive">
                    <div className="flex items-center justify-center gap-2 mb-2 w-full">
                      <span className="text-xs text-[var(--text-secondary)] font-bold tracking-[0.2em] uppercase">{t.common.sha256}</span>
                      <button onClick={() => handleCopy(hash, 'hashRev')} className="text-[var(--text-secondary)] hover:text-white transition-colors p-1">
                        {copiedField === 'hashRev' ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    </div>
                    <div className="font-mono text-xs sm:text-lg text-indigo-200/70 break-all leading-relaxed w-full px-2">{hash}</div>
                  </div>
                </>
              )}

              {/* NOT FOUND */}
              {status === "not_found" && (
                <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-[var(--error)]/30 flex flex-col items-center justify-center shadow-inner text-center relative overflow-hidden card-padding-adaptive">
                  <div className="absolute left-1/2 top-1/2 w-48 h-48 bg-[var(--error)]/10 blur-[40px] rounded-full -translate-y-1/2 -translate-x-1/2"></div>
                  <div className="text-6xl mb-6 relative z-10">❌</div>
                  <h3 className="text-3xl font-extrabold text-white mb-4 relative z-10">{t.verify.not_found}</h3>
                  <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-md mx-auto relative z-10 leading-relaxed">{t.verify.not_found_hint}</p>
                </div>
              )}

              {/* ERROR */}
              {status === "error" && (
                <div className="bg-[var(--bg-primary)] w-full rounded-3xl border border-[var(--error)]/30 flex flex-col items-center justify-center shadow-inner text-center relative overflow-hidden card-padding-adaptive">
                  <div className="text-6xl mb-6 relative z-10 animate-[pulse_1.5s_ease-in-out_infinite]">⚠️</div>
                  <h3 className="text-3xl font-extrabold text-white mb-4 relative z-10">{locale === "uk" ? "Помилка" : "Error"}</h3>
                  <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-md mx-auto relative z-10 leading-relaxed">
                    {errorMessage || (locale === "uk" ? "Перевірте формат хешу або підключення до мережі." : "Check hash format or network connection.")}
                  </p>
                </div>
              )}

              {/* Back Button */}
              <div className="flex justify-center w-full pt-6">
                <button 
                  className="px-12 py-5 rounded-2xl font-bold text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all text-lg" 
                  onClick={() => {
                    setStatus("idle");
                    setHash("");
                    setInputHash("");
                    setFile(null);
                    setErrorMessage("");
                  }}
                >
                  {t.common.back}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}