"use client";

import { useState, useCallback } from "react";
import { Contract } from "ethers";
import { hashFile } from "@/app/lib/hash";

type RegisterStatus = "idle" | "hashing" | "ready" | "pending" | "success" | "error";

interface RegisterDocumentProps {
  contract: Contract | null;
  account: string | null;
}

export default function RegisterDocument({ contract, account }: RegisterDocumentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [status, setStatus] = useState<RegisterStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setFile(null);
    setHash(null);
    setStatus("idle");
    setTxHash(null);
    setErrorMsg(null);
  };

  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setStatus("hashing");
    setErrorMsg(null);
    setTxHash(null);

    try {
      const fileHash = await hashFile(selectedFile);
      setHash(fileHash);
      setStatus("ready");
    } catch {
      setErrorMsg("Помилка при хешуванні файлу");
      setStatus("error");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleRegister = async () => {
    if (!contract || !hash) return;

    setStatus("pending");
    setErrorMsg(null);

    try {
      const tx = await contract.registerDocument(hash);
      setTxHash(tx.hash);
      await tx.wait();
      setStatus("success");
    } catch (err: unknown) {
      let message = "Помилка при реєстрації документа";

      if (typeof err === "object" && err !== null) {
        const error = err as { code?: string | number; reason?: string; message?: string };
        if (error.code === "ACTION_REJECTED" || error.code === 4001) {
          message = "Транзакцію було відхилено в MetaMask";
        } else if (error.reason?.includes("already registered")) {
          message = "Цей документ вже зареєстрований в блокчейні";
        } else if (error.message?.includes("already registered")) {
          message = "Цей документ вже зареєстрований в блокчейні";
        }
      }

      setErrorMsg(message);
      setStatus("error");
    }
  };

  // Форматування розміру файлу
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="card" id="register-section">
      <div className="card-header">
        <div className="card-icon register-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 16H13V19H11V16H8V14H11V11H13V14H16V16ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
          </svg>
        </div>
        <h2 className="card-title">Реєстрація документа</h2>
        <p className="card-subtitle">Зареєструйте хеш документа в блокчейні Ethereum</p>
      </div>

      <div className="card-body">
        {/* Drop zone */}
        <div
          className={`drop-zone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("register-file-input")?.click()}
          id="register-drop-zone"
        >
          <input
            type="file"
            id="register-file-input"
            onChange={handleFileChange}
            className="hidden"
          />
          {!file ? (
            <div className="drop-zone-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-icon">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM14 13V17H10V13H7L12 8L17 13H14Z" fill="currentColor"/>
              </svg>
              <p className="drop-text">Перетягніть файл сюди</p>
              <p className="drop-hint">або натисніть для вибору</p>
            </div>
          ) : (
            <div className="file-info">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="file-icon">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM14 18H6V16H14V18ZM16 14H6V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
              </svg>
              <div className="file-details">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{formatSize(file.size)}</p>
              </div>
              <button
                className="file-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                }}
                aria-label="Видалити файл"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Hash display */}
        {status === "hashing" && (
          <div className="hash-display hashing">
            <span className="spinner" />
            <span>Обчислення SHA-256 хешу...</span>
          </div>
        )}

        {hash && status !== "hashing" && (
          <div className="hash-display">
            <span className="hash-label">SHA-256:</span>
            <code className="hash-value">{hash}</code>
          </div>
        )}

        {/* Register button */}
        {status === "ready" && (
          <button
            className="action-btn register-btn"
            onClick={handleRegister}
            disabled={!account}
            id="register-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
            </svg>
            Зареєструвати в блокчейні
          </button>
        )}

        {status === "pending" && (
          <div className="status-message pending">
            <span className="spinner" />
            <div>
              <p>Очікування підтвердження транзакції...</p>
              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  Переглянути на Etherscan ↗
                </a>
              )}
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="status-message success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
            </svg>
            <div>
              <p>Документ успішно зареєстрований!</p>
              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  Переглянути на Etherscan ↗
                </a>
              )}
            </div>
          </div>
        )}

        {status === "error" && errorMsg && (
          <div className="status-message error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            </svg>
            <p>{errorMsg}</p>
          </div>
        )}

        {!account && status !== "idle" && (
          <p className="wallet-warning">Підключіть гаманець для реєстрації документа</p>
        )}
      </div>
    </div>
  );
}
