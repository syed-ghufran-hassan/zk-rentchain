 
<template>
  <div>
    <h1>Dashboard</h1>

    <!-- Not connected -->
    <div v-if="!connected" class="card">
      <h3>Welcome to RentChain on Mina</h3>
      <p style="color: #94a3b8; line-height: 1.7;">
        A privacy-preserving rental agreement protocol built on Mina Protocol.
        Connect your Auro Wallet to interact with the live Devnet contracts.
      </p>
      <button class="btn" :disabled="!hasWallet" @click="connect">
        {{ hasWallet ? 'Connect Wallet to Continue' : 'Install Auro Wallet First' }}
      </button>
      <p v-if="!hasWallet" style="color: #94a3b8; font-size: 0.85rem; margin-top: 1rem;">
        Get Auro Wallet from
        <a
          href="https://www.aurowallet.com/"
          target="_blank"
          style="color: #818cf8;"
        >
          auro
        </a>
      </p>
    </div>

    <!-- Connected dashboard -->
    <div v-else>
      <!-- Wallet info -->
      <div class="card">
        <h3>Your Wallet</h3>
        <p class="mono" style="word-break: break-all;">{{ address }}</p>
        <p style="color: #94a3b8; font-size: 0.9rem; margin: 0;">
          Network: <span class="badge">{{ network ?? 'unknown' }}</span>
        </p>
      </div>

      <!-- Deployed contracts -->
      <h2 style="margin-top: 2rem;">Deployed Contracts</h2>
      <div class="grid grid-2">
        <div v-for="c in contracts" :key="c.name" class="card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">{{ c.name }}</h3>
            <span class="badge badge-success">Deployed</span>
          </div>
          <p class="mono" style="margin-top: 0.75rem; word-break: break-all;">
            {{ c.address }}
          </p>
          <a
            :href="`https://minascan.io/devnet/account/${c.address}`"
            target="_blank"
            style="color: #818cf8; font-size: 0.85rem;"
          >
            View on MinaScan →
          </a>
        </div>
      </div>

      <!-- Quick actions -->
      <h2 style="margin-top: 2rem;">Quick Actions</h2>
      <div class="grid grid-2">
        <NuxtLink
          to="/property"
          class="card"
          style="text-decoration: none; cursor: pointer; color: inherit;"
        >
          <h3>🏡 Register a Property</h3>
          <p style="color: #94a3b8; margin: 0;">
            Mint a PropertyNFT that represents your real estate.
          </p>
        </NuxtLink>

        <NuxtLink
          to="/agreement"
          class="card"
          style="text-decoration: none; cursor: pointer; color: inherit;"
        >
          <h3>📝 Sign an Agreement</h3>
          <p style="color: #94a3b8; margin: 0;">
            View and interact with the deployed RentalAgreement.
          </p>
        </NuxtLink>
      </div>

      <!-- Protocol stats -->
      <h2 style="margin-top: 2rem;">Protocol</h2>
      <div class="grid grid-2">
        <div class="card">
          <h3>🌙 Mina Protocol</h3>
          <p style="color: #94a3b8; font-size: 0.9rem; margin: 0;">
            22 KB constant-size blockchain. Client-side proving. Native privacy.
          </p>
        </div>
        <div class="card">
          <h3>🔒 Zero-Knowledge Rentals</h3>
          <p style="color: #94a3b8; font-size: 0.9rem; margin: 0;">
            Tenant eligibility proven without revealing income, history, or identity.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const { connected, address, network, hasWallet, connect } = useMina();

const contracts = [
  { name: 'PropertyNFT', address: config.public.propertyNFT },
  { name: 'RentalHistory', address: config.public.rentalHistory },
  { name: 'RentalOracle', address: config.public.rentalOracle },
  { name: 'RentalAgreement', address: config.public.rentalAgreement },
];
</script>
 