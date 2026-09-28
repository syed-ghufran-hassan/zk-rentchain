 
<template>
  <div>
    <nav>
      <div style="display: flex; align-items: center;">
        <NuxtLink to="/" style="font-weight: 700; font-size: 1.1rem; margin-right: 2rem;">
          🏠 RentChain <span style="color: #818cf8; font-size: 0.8rem;">on Mina</span>
        </NuxtLink>
        <NuxtLink to="/">Dashboard</NuxtLink>
        <NuxtLink to="/property">Register Property</NuxtLink>
        <NuxtLink to="/agreement">Agreement</NuxtLink>
      </div>
      <div style="display: flex; align-items: center; gap: 0.8rem;">
        <button
          v-if="!connected"
          class="btn"
          :disabled="!hasWallet"
          @click="connect"
        >
          {{ hasWallet ? 'Connect Wallet' : 'Install Auro Wallet' }}
        </button>
        <div v-else style="display: flex; align-items: center; gap: 0.8rem;">
          <span class="badge badge-success">{{ network ?? 'devnet' }}</span>
          <span class="mono">{{ shortAddress }}</span>
          <button class="btn btn-secondary" @click="disconnect">×</button>
        </div>
      </div>
    </nav>

    <div class="container">
      <div v-if="state.error" class="error">{{ state.error }}</div>
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  connected,
  hasWallet,
  shortAddress,
  network,
  state,
  connect,
  disconnect,
} = useMina();
</script>
 