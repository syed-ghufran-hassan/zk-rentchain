<template>
  <div>
    <h1>Rental Agreement</h1>

    <div v-if="!connected" class="card">
      <p>Connect your wallet to interact with the agreement.</p>
      <button class="btn" @click="connect">Connect Wallet</button>
    </div>

    <div v-else>
      <!-- Loading state -->
      <div v-if="loadingState" class="card">
        <span class="loading"></span>
        <span style="margin-left: 0.5rem;">Loading on-chain state...</span>
      </div>

      <div v-else>
        <!-- Status messages -->
        <div v-if="actionError" class="error">{{ actionError }}</div>
        <div v-if="actionSuccess" class="success">
          Transaction sent! Hash:
          <span class="mono">{{ actionSuccess }}</span>
        </div>

        <!-- Agreement state card -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3 style="margin: 0;">Agreement State</h3>
            <span :class="['badge', stateBadgeClass]">{{ stateLabel }}</span>
          </div>

          <table style="width: 100%; margin-top: 1rem; font-size: 0.9rem; border-collapse: collapse;">
            <tbody>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #94a3b8; padding: 0.5rem 0; width: 35%;">Contract</td>
                <td class="mono" style="word-break: break-all;">{{ agreementAddress }}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #94a3b8; padding: 0.5rem 0;">Owner</td>
                <td class="mono" style="word-break: break-all;">{{ owner ?? '—' }}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #94a3b8; padding: 0.5rem 0;">Tenant</td>
                <td class="mono" style="word-break: break-all;">{{ tenant ?? '—' }}</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #94a3b8; padding: 0.5rem 0;">Rent</td>
                <td>{{ rent }} MINA</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #94a3b8; padding: 0.5rem 0;">Deposit</td>
                <td>{{ deposit }} MINA</td>
              </tr>
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="color: #94a3b8; padding: 0.5rem 0;">Lease Duration</td>
                <td>{{ duration }} days</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; padding: 0.5rem 0;">Payment Interval</td>
                <td>{{ interval }} day(s)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Action buttons -->
        <div class="card">
          <h3>Actions</h3>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button
              class="btn"
              :disabled="!canSignAsOwner || busy"
              @click="action('signAsOwner')"
            >
              <span v-if="busy && currentAction === 'signAsOwner'" class="loading"></span>
              <span>{{ busy && currentAction === 'signAsOwner' ? 'Proving (30-60s)...' : 'Sign as Owner' }}</span>
            </button>

            <button
              class="btn btn-success"
              :disabled="!canSignAsTenant || busy"
              @click="action('signAsTenant')"
            >
              <span v-if="busy && currentAction === 'signAsTenant'" class="loading"></span>
              <span>{{ busy && currentAction === 'signAsTenant' ? 'Proving (30-60s)...' : 'Sign as Tenant (pay deposit)' }}</span>
            </button>

            <button
              class="btn"
              :disabled="state !== 3 || busy"
              @click="action('endLease')"
            >
              <span v-if="busy && currentAction === 'endLease'" class="loading"></span>
              <span>{{ busy && currentAction === 'endLease' ? 'Proving...' : 'End Lease' }}</span>
            </button>

            <button
              class="btn btn-secondary"
              :disabled="state !== 4 || busy"
              @click="action('releaseDeposit')"
            >
              <span v-if="busy && currentAction === 'releaseDeposit'" class="loading"></span>
              <span>{{ busy && currentAction === 'releaseDeposit' ? 'Proving...' : 'Release Deposit' }}</span>
            </button>

            <button
              class="btn btn-danger"
              :disabled="state !== 4 || busy"
              @click="action('disputeDeposit')"
            >
              <span v-if="busy && currentAction === 'disputeDeposit'" class="loading"></span>
              <span>{{ busy && currentAction === 'disputeDeposit' ? 'Proving...' : 'Dispute' }}</span>
            </button>
          </div>

          <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 1rem;">
            Each transaction generates a ZK proof in your browser (30–60s),
            then Auro Wallet signs and broadcasts it.
          </p>
        </div>

        <!-- Info card -->
        <div class="card">
          <h3>About this agreement</h3>
          <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.7;">
            This RentalAgreement is one of four zkApps deployed to Mina Devnet.
            State transitions are enforced by o1js circuits, and all data is
            committed to the 22KB Mina blockchain via zk-SNARKs.
          </p>
          <a
            :href="`https://minascan.io/devnet/account/${agreementAddress}`"
            target="_blank"
            style="color: #818cf8; font-size: 0.85rem;"
          >
            View on MinaScan →
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const { connected, address, connect } = useMina();

const agreementAddress = config.public.rentalAgreement as string;

// UI state
const loadingState = ref(true);
const busy = ref(false);
const currentAction = ref('');
const actionError = ref('');
const actionSuccess = ref('');

// On-chain state mirrors
const state = ref(0);
const owner = ref('');
const tenant = ref('');
const rent = ref('1');
const deposit = ref('2');
const duration = ref('30');
const interval = ref('1');

// State labels
const stateLabels = [
  'Created',
  'Owner Signed',
  'Tenant Signed',
  'Active',
  'Ended',
  'Disputed',
];
const stateLabel = computed(() => stateLabels[state.value] ?? 'Unknown');
const stateBadgeClass = computed(() => {
  switch (state.value) {
    case 3: return 'badge-success';
    case 4: return 'badge-warning';
    case 5: return 'badge-error';
    default: return '';
  }
});

// Permission gating
const canSignAsOwner = computed(() => {
  if (!address.value || !owner.value) return false;
  if (state.value !== 0 && state.value !== 2) return false;
  return address.value === owner.value;
});

const canSignAsTenant = computed(() => {
  if (!address.value || !tenant.value) return false;
  if (state.value !== 0 && state.value !== 1) return false;
  return address.value === tenant.value;
});

/**
 * Load on-chain state via GraphQL.
 * Falls back to the hardcoded values from deployment if fetch fails.
 */
const loadState = async () => {
  loadingState.value = true;
  try {
    const response = await $fetch<any>(
      config.public.networkUrl as string,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          query: `{
            account(publicKey: "${agreementAddress}") {
              zkappState
            }
          }`,
        },
      }
    );

    const zkState = response?.data?.account?.zkappState;
    if (zkState && zkState.length > 0) {
      // Layout from contracts/src/RentalAgreement.ts:
      // [0] = owner, [1] = tenant, [2] = rentAmount, [3] = depositAmount,
      // [4] = leaseDuration, [5] = paymentInterval, [6] = leaseStart,
      // [7] = leaseEnd, [8] = lastPaymentTimestamp, [9] = depositHeld,
      // [10] = stateHash, ...
      state.value = Number(BigInt(zkState[10] ?? 0));
      rent.value = (BigInt(zkState[2] ?? 0) / 1_000_000_000n).toString();
      deposit.value = (BigInt(zkState[3] ?? 0) / 1_000_000_000n).toString();
      duration.value = (BigInt(zkState[4] ?? 0) / 86_400n).toString();
      interval.value = (BigInt(zkState[5] ?? 0) / 86_400n).toString();
    }
  } catch (e: any) {
    console.warn('Failed to fetch on-chain state:', e?.message);
    // Fall back to the values from the deploy script
    owner.value = 'B62qpcTNWsrYVSemA6pQikJZzRVuhw6AEnfVydbwxLsbNKhjkJEkSq9';
    tenant.value = 'B62qoUqzbZ6h4CsGzEr2pJAMzz2MkaLto9kJ4ziv2Agt5kEP3t6QX9B';
  } finally {
    loadingState.value = false;
  }
};

/**
 * Send a method call to the RentalAgreement contract.
 * Builds → proves → sends via Auro Wallet.
 */
const action = async (method: string) => {
  busy.value = true;
  currentAction.value = method;
  actionError.value = '';
  actionSuccess.value = '';

  try {
    const { o1js, Mina, PublicKey, agreement } = await useMina().loadContracts();
    const { UInt64 } = o1js;

    if (!address.value) throw new Error('Wallet not connected');

    const feePayer = {
      sender: PublicKey.fromBase58(address.value),
      fee: 100_000_000, // 0.1 MINA
    };

    const tx = await Mina.transaction(feePayer, async () => {
      switch (method) {
        case 'signAsOwner':
          await agreement.signAsOwner();
          break;
        case 'signAsTenant':
          // Deposit: 2 MINA = 2_000_000_000 nanomina
          await agreement.signAsTenant(UInt64.from(2_000_000_000));
          break;
        case 'endLease':
          await agreement.endLease();
          break;
        case 'releaseDeposit':
          await agreement.releaseDeposit();
          break;
        case 'disputeDeposit':
          await agreement.disputeDeposit();
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    });

    // Prove in browser (~30-60s)
    await tx.prove();

    // Send via Auro Wallet
    if (!window.mina) throw new Error('Auro Wallet not available');
    const result = await window.mina.sendTransaction({
      transaction: tx.toJSON(),
      feePayer: { fee: 100_000_000 },
    });

    actionSuccess.value = result.hash;

    // Refresh state after ~30 seconds (allow block inclusion)
    setTimeout(loadState, 30_000);
  } catch (e: any) {
    console.error(e);
    actionError.value = e?.message ?? 'Transaction failed';
  } finally {
    busy.value = false;
    currentAction.value = '';
  }
};

onMounted(() => {
  loadState();
});
</script>