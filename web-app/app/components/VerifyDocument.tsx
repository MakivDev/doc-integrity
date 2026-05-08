"use client";

import { useState, useCallback } from "react";
import { Contract } from "ethers";
import { hashFile } from "@/app/lib/hash";

type VerifyStatus = "idle" | "hashing" | "verifying" | "found" | "not-found" | "error";

interface VerifyResult {
  isRegistered: boolean;
  timestamp: number;
  author: string;
}

interface VerifyDocumentProps {
  contract: Contract | null;
  account: string | null;
}

export default function VerifyDocument({ contract, account }: VerifyDocumentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setFile(null);
    setHash(null);
    setStatus("idle");
    setResult(null);
    setErrorMsg(null);
  };

  const processAndVerify = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setStatus("hashing");
      setErrorMsg(null);
      setResult(null);

      try {
        // Крок 1: Локальне хешування
        const fileHash = await hashFile(selectedFile);
        setHash(fileHash);

        if (!contract) {
          setErrorMsg("Підключіть гаманець для перевірки");
          setStatus("error");
          return;
        }

        // Крок 2: Виклик view-функції контракту (без gas)
        setStatus("verifying");
        const [isRegistered, timestamp, author] = await contract.verifyDocument(fileHash);

        setResult({
          isRegistered,
          timestamp: Number(timestamp),
          author,
        });
        setStatus(isRegistered ? "found" : "not-found");
      } catch (err: unknown) {
        let message = "Помилка при перевірці документа";
        if (err instanceof Error) {
          message = err.message;
        }
        setErrorMsg(message);
        setStatus("error");
      }
    },
    [contract]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processAndVerify(selectedFile);
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
      processAndVerify(droppedFile);
    }
  };

  // Форматування дати з Unix timestamp
  const formatDate = (ts: number) => {
    if (ts === 0) return "—";
    const date = new Date(ts * 1000);
    return date.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Скорочення адреси
  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Форматування розміру файлу
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="card" id="verify-section">
      <div className="card-header">
        <div className="card-icon verify-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="currentColor"/>
          </svg>
        </div>
        <h2 className="card-title">Перевірка документа</h2>
        <p className="card-subtitle">Перевірте, чи зареєстрований документ у блокчейні</p>
      </div>

      <div className="card-body">
        {/* Drop zone */}
        <div
          className={`drop-zone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("verify-file-input")?.click()}
          id="verify-drop-zone"
        >
          <input
            type="file"
            id="verify-file-input"
            onChange={handleFileChange}
            className="hidden"
          />
          {!file ? (
            <div className="drop-zone-content">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-icon">
                <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
              </svg>
              <p className="drop-text">Перетягніть файл для перевірки</p>
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
        {(status === "hashing" || status === "verifying") && (
          <div className="hash-display hashing">
            <span className="spinner" />
            <span>
              {status === "hashing"
                ? "Обчислення SHA-256 хешу..."
                : "Перевірка в блокчейні..."}
            </span>
          </div>
        )}

        {hash && status !== "hashing" && status !== "verifying" && (
          <div className="hash-display">
            <span className="hash-label">SHA-256:</span>
            <code className="hash-value">{hash}</code>
          </div>
        )}

        {/* Verification result */}
        {status === "found" && result && (
          <div className="verify-result found">
            <div className="result-header">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
              </svg>
              <span>Документ зареєстрований</span>
            </div>
            <div className="result-details">
              <div className="result-row">
                <span className="result-label">Автор:</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${result.author}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-value address-link"
                >
                  {shortenAddress(result.author)}
                </a>
              </div>
              <div className="result-row">
                <span className="result-label">Дата реєстрації:</span>
                <span className="result-value">{formatDate(result.timestamp)}</span>
              </div>
            </div>
          </div>
        )}

        {status === "not-found" && (
          <div className="verify-result not-found">
            <div className="result-header">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.47 2 2 6.47 2 12C2 17.53 6.47 22 12 22C17.53 22 22 17.53 22 12C22 6.47 17.53 2 12 2ZM17 15.59L15.59 17L12 13.41L8.41 17L7 15.59L10.59 12L7 8.41L8.41 7L12 10.59L15.59 7L17 8.41L13.41 12L17 15.59Z" fill="currentColor"/>
              </svg>
              <span>Документ не знайдений</span>
            </div>
            <p className="result-hint">
              Цей документ не зареєстрований у блокчейні. Ви можете зареєструвати його у секції вище.
            </p>
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

        {!account && status === "idle" && (
          <p className="wallet-warning">Підключіть гаманець для перевірки документа</p>
        )}
      </div>
    </div>
  );
}
