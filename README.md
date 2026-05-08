# DocIntegrity — Blockchain Document Verification System

> Дипломна робота · Національний авіаційний університет · 2026

A full-stack Web3 application for tamper-proof document verification using blockchain technology. Users can register document hashes on the Ethereum blockchain and verify document authenticity at any time — without uploading the actual file anywhere.

---

## 🏗️ Architecture

```
Diploma/
├── blockchain/      # Hardhat 3 project — Solidity smart contract
└── web-app/         # Next.js 15 frontend + Prisma SQLite backend
```

### How it works

1. **Register** — The user selects a file; SHA-256 hash is computed locally in the browser (via Web Crypto API). The hash, along with metadata, is sent to the `DocumentRegistry` smart contract on the Sepolia testnet via MetaMask.
2. **Verify** — The user selects any file; its hash is computed locally and checked against the on-chain registry. A match proves the document is authentic and unmodified.

---

## 🔗 Smart Contract

**Location:** `blockchain/`  
**Network:** Ethereum Sepolia Testnet  
**Contract:** `DocumentRegistry.sol`

### Key features
- Register document hash with owner address, filename, description, and timestamp
- Verify document existence and integrity on-chain
- Transfer document ownership
- Revoke document registration
- Full event log for all actions

### Setup

```bash
cd blockchain
npm install
```

Create a `.env` file (see `.env.example`):
```
PRIVATE_KEY="your_wallet_private_key"
```

```bash
# Compile
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat ignition deploy ignition/modules/DocumentRegistry.ts --network sepolia
```

---

## 🌐 Web Application

**Location:** `web-app/`  
**Stack:** Next.js 15 · TypeScript · Prisma ORM · Ethers.js · MetaMask

### Key features
- Local SHA-256 hashing (file never leaves the browser)
- MetaMask wallet integration
- On-chain document registration & verification
- SQLite metadata cache via Prisma
- Glassmorphism UI with dark theme

### Setup

```bash
cd web-app
npm install
```

Create a `.env` file (see `.env.example`):
```
DATABASE_URL="file:./dev.db"
```

```bash
# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.x, Hardhat 3 |
| Blockchain Network | Ethereum Sepolia Testnet |
| Frontend | Next.js 15, TypeScript, CSS |
| Wallet | MetaMask, Ethers.js v6 |
| Database | SQLite via Prisma ORM |
| Hashing | Web Crypto API (SHA-256) |

---

## 📄 License

MIT
