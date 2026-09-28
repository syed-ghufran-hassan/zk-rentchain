 
<template>
  <div>
    <h1>Register a Property</h1>

    <div v-if="!connected" class="card">
      <p>Connect your wallet first.</p>
      <button class="btn" @click="connect">Connect Wallet</button>
    </div>

    <div v-else>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">
        Property registered! Tx: <span class="mono">{{ success }}</span>
      </div>

      <div class="card">
        <h3>Property Details</h3>
        <div style="margin-bottom: 1rem;">
          <label>Property Metadata (IPFS URI or description)</label>
          <input
            v-model="metadataURI"
            class="input"
            placeholder="ipfs://Qm... or 'Apartment in Lisbon'"
          />
        </div>
        <button
          class="btn"
          :disabled="loading || syncing || !metadataURI"
          @click="register"
        >
          <span v-if="loading || syncing" class="loading"></span>
          <span>{{ loading ? 'Proving (30-60s)...' : syncing ? 'Syncing state...' : 'Register Property' }}</span>
        </button>
      </div>

      <div class="card">
        <h3>How it works</h3>
        <ol style="color: #94a3b8; font-size: 0.9rem; line-height: 1.7;">
          <li>The UI syncs the MerkleMap from the on-chain root.</li>
          <li>A witness is generated for the empty owner + metadata slots.</li>
          <li>o1js proves the transaction in your browser (30-60s).</li>
          <li>Auro Wallet signs and broadcasts the proved transaction.</li>
          <li>The PropertyNFT is minted and the on-chain root updates.</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { connected, connect } = useMina();
const { loading, syncing, error, registerProperty } = usePropertyNFT();

const metadataURI = ref('');
const success = ref('');

const register = async () => {
  success.value = '';
  try {
    const hash = await registerProperty(metadataURI.value);
    success.value = hash;
    metadataURI.value = '';
  } catch {
    // error handled in composable
  }
};
</script>
 