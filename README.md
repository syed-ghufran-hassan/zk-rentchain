 
> 🌐 **Live Demo:** [zk-rentchain-fqpf.vercel.app](https://zk-rentchain-fqpf.vercel.app/)


# RentChain on Mina Protocol

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://zk-rentchain-fqpf.vercel.app/)
[![Mina Devnet](https://img.shields.io/badge/Mina-Devnet%20Live-blue)](https://minascan.io/devnet)
[![Built with o1js](https://img.shields.io/badge/Built%20with-o1js-orange)](https://docs.o1labs.org/o1js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A **privacy-preserving rental agreement protocol** built on Mina Protocol using `o1js`. RentChain brings real-world asset (RWA) tokenization to Mina with native zero-knowledge proofs, enabling private rentals without revealing sensitive tenant data.
 

---

## 🌙 Why Mina?

- **22 KB blockchain** — always verifiable, always decentralized
- **Native privacy** — prove eligibility without revealing income or rental history
- **Client-side proving** — sensitive data never leaves the user's device
- **Recursive zk-SNARKs** — efficient verification of complex rental histories
- **STOPE alignment** — Mina Foundation + Mirae Asset are actively building RWA privacy infrastructure on Mina

---

## 🏗️ Architecture

The system consists of five core zkApps (four currently deployed on Devnet, `RentStreamToken` planned):

| zkApp | Purpose |
|-------|---------|
| **PropertyNFT** | ERC-721 equivalent. Tracks property ownership and metadata via Merkle maps stored in on-chain state. |
| **RentalAgreement** | Full rental lifecycle: signing, escrow, rent payments, lease end, deposit release, and disputes. |
| **RentStreamToken** | Mina fungible token representing a share of a future rent stream. |
| **RentalHistory** | Immutable, privacy-preserving rental records per user. |
| **RentalOracle** | zkTLS-based inspection oracle for off-chain data. |

---

## 🔐 Privacy Features

RentChain on Mina enables **selective disclosure** — tenants prove eligibility without revealing underlying data:

| Proof | What it proves | What stays private |
|-------|----------------|-------------------|
| **Good rental history** | ≥ N successful rentals | Which rentals, exact count |
| **Income sufficiency** | Income ≥ 3× rent | Exact salary, employer |
| **No disputes** | Zero unresolved disputes | Dispute details, counterparties |
| **KYC compliance** | Passed KYC | Identity documents, PII |

---

## 📁 Repository Layout

zk-rentchain/
├── contracts/ # o1js smart contracts
│ ├── src/
│ │ ├── PropertyNFT.ts # ERC-721 equivalent (MerkleMap-based)
│ │ ├── RentalAgreement.ts # Full rental lifecycle
│ │ ├── RentalHistory.ts # Private rental records
│ │ ├── RentalOracle.ts # Inspection oracle
│ │ ├── RentalAgreement.test.ts
│ │ └── deploy-all.ts # Deploys all 4 zkApps to Devnet
│ └── deployed.json # Address manifest
├── ui/ # Nuxt 3 frontend
│ ├── app/
│ │ ├── app.vue # Nav + layout
│ │ ├── composables/
│ │ │ ├── useMina.ts # Wallet + contract loading
│ │ │ └── usePropertyNFT.ts # MerkleMap sync + registerProperty
│ │ └── pages/
│ │ ├── index.vue # Dashboard
│ │ ├── property.vue # Register a property
│ │ └── agreement.vue # Sign + interact with agreement
│ ├── nuxt.config.ts
│ └── vercel.json
└── README.md


---

## 🛠️ Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| zkApp CLI | latest | `npm install -g zkapp-cli` |

### Install Dependencies

```bash
# Contracts
cd contracts
npm install

# UI
cd ../ui
npm install
```

### Tests

```bash
cd contracts

# Build
npm run build

# Run all tests
npm run test

# Watch mode
npm run testw
```



---

## 📋 Deployed Addresses (Mina Devnet)

| zkApp | Address |
|-------|---------|
| **PropertyNFT** | [`B62qouAdEAptokm6QTPeXA6TFtd4ovRxT7KwyY8GYa9VgNFusCLSbbu`](https://minascan.io/devnet/account/B62qouAdEAptokm6QTPeXA6TFtd4ovRxT7KwyY8GYa9VgNFusCLSbbu) |
| **RentalHistory** | [`B62qnJ3FrEpP6YabWFXJ4dmZ2jYRRAQ8kM5au9DVmiH8eoZc6JKnvq6`](https://minascan.io/devnet/account/B62qnJ3FrEpP6YabWFXJ4dmZ2jYRRAQ8kM5au9DVmiH8eoZc6JKnvq6) |
| **RentalOracle** | [`B62qq69rKhFP8upJqws4keopDbh5vxep85dXRFR2i2W51ZvmomqHegw`](https://minascan.io/devnet/account/B62qq69rKhFP8upJqws4keopDbh5vxep85dXRFR2i2W51ZvmomqHegw) |
| **RentalAgreement** | [`B62qmMYBtthZSZ1APbfGhLwg118hHoeLt1W15eU2ar4qjqYZQ84LTGg`](https://minascan.io/devnet/account/B62qmMYBtthZSZ1APbfGhLwg118hHoeLt1W15eU2ar4qjqYZQ84LTGg) |

**Network:** Mina Devnet (`https://devnet-plain-1.gcp.o1test.net/graphql`)
**Deploy date:** September 2026

## 🚀 Live Deployment

| Environment | URL |
|-------------|-----|
| **Frontend** | [https://zk-rentchain-fqpf.vercel.app](https://zk-rentchain-fqpf.vercel.app/) |
| **Host** | Vercel (auto-deploys on `main` push) |
| **Network** | Mina Devnet |
| **GraphQL** | `https://devnet-plain-1.gcp.o1test.net/graphql` |

### What works on the live site

- ✅ Dashboard with all 4 deployed zkApps
- ✅ Auro Wallet connection (Devnet)
- ✅ Read-only view of the RentalAgreement state
- ✅ MinaScan links to verify on-chain state
- ✅ COOP/COEP headers enabled → in-browser ZK proof generation works

### Local development

For a full feature-complete experience (including property registration and
transaction signing), clone the repo and run locally:

```bash
git clone https://github.com/syed-ghufran-hassan/zk-rentchain.git
cd zk-rentchain/ui
npm install
npm run dev
# → http://localhost:3000
```

---

## 🎯 Roadmap

### ✅ Milestone 0 — Foundation (Complete)

- [x] Four zkApps implemented in o1js (PropertyNFT, RentalAgreement, RentalHistory, RentalOracle)
- [x] Unit tests passing
- [x] Deployed to Mina Devnet with unique addresses per contract
- [x] Nuxt 3 UI with wallet connection and read-only state view
- [x] Live demo on Vercel

### ⏳ Milestone 1 — In-Browser Proofs (In Progress)

- [ ] MerkleMap witness sync from on-chain root
- [ ] Full in-browser proof generation for all core methods
- [ ] Auro Wallet transaction handoff
- [ ] Progress UI (30–60s proof feedback)

### 📅 Milestone 2 — RentStreamToken + Private Circuits

- [ ] `RentStreamToken` zkApp (Mina fungible token)
- [ ] Three private eligibility circuits:
  - Good rental history (≥N successful rentals)
  - Income sufficiency (income ≥ 3× rent)
  - No unresolved disputes
- [ ] Integration tests with >90% coverage

### 📅 Milestone 3 — Audit & User Testing

- [ ] Third-party security audit
- [ ] Onboard 10 property owners, 20 tenants
- [ ] 10 full agreements executed on Devnet

### 📅 Milestone 4 — Mainnet Launch

- [ ] All zkApps deployed to Mina Mainnet
- [ ] First real property tokenized with legal wrapper
- [ ] $10k rent volume processed

---
 

| Mina Priority | How RentChain Delivers |
|---------------|----------------------|
| **Feeding the Proof** | Onboarding real-world rental data (leases, inspection reports) to Mina |
| **Verifiable Compute** | Rental agreement logic runs off-chain with on-chain proofs |
| **RWA Focus** | Direct application of Mina's STOPE framework for tokenized real estate |
| **Privacy** | Tenants prove eligibility without revealing income, identity, or history |

---

## 🙏 Acknowledgements

- [Mina Protocol](https://minaprotocol.com) — zkApp platform
- [o1js](https://docs.o1labs.org/o1js) — TypeScript zkApp SDK
- [zkApp CLI](https://www.npmjs.com/package/zkapp-cli) — Project scaffolding
- [Auro Wallet](https://www.aurowallet.com/) — Browser wallet
- [Nuxt](https://nuxt.com) — Vue framework
- [Vercel](https://vercel.com) — Hosting

---

## 📄 License

MIT
