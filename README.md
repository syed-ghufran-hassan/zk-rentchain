 
# RentChain on Mina Protocol

A **privacy-preserving rental agreement protocol** built on Mina Protocol using `o1js`. RentChain brings real-world asset (RWA) tokenization to Mina with native zero-knowledge proofs, enabling private rentals without revealing sensitive tenant data.
 

---

## 🌙 Why Mina?

- **22 KB blockchain** — always verifiable, always decentralized
- **Native privacy** — prove eligibility without revealing income or rental history
- **Client-side proving** — sensitive data never leaves the user's device
- **Recursive zk-SNARKs** — efficient verification of complex rental histories
- **STOPE alignment** — Mina Foundation + Mirae Asset are actively building RWA privacy infrastructure on Mina[reference:1]

---

## 🏗️ Architecture

The system consists of five core zkApps:

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
