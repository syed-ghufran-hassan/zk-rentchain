/**
 * useMina — wallet connection + shared Mina state.
 *
 * Wraps Auro Wallet (window.mina) and exposes reactive state
 * used across all pages and composables.
 */
import { ref, computed } from 'vue';

declare global {
  interface Window {
    mina?: {
      requestAccounts(): Promise<string[]>;
      requestNetwork(): Promise<{ networkID: string }>;
      sendTransaction(args: {
        transaction: string;
        feePayer?: { fee: number; memo?: string };
      }): Promise<{ hash: string }>;
      on(event: string, handler: (data: any) => void): void;
    };
  }
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  error: string | null;
}

// Module-level reactive state — shared across all consumers
const state = ref<WalletState>({
  connected: false,
  address: null,
  network: null,
  error: null,
});

export const useMina = () => {
  const config = useRuntimeConfig();

  const hasWallet = computed(
    () => typeof window !== 'undefined' && !!window.mina
  );
  const address = computed(() => state.value.address);
  const connected = computed(() => state.value.connected);
  const network = computed(() => state.value.network);
  const shortAddress = computed(() => {
    if (!state.value.address) return '';
    return `${state.value.address.slice(0, 8)}...${state.value.address.slice(-6)}`;
  });

  /**
   * Connect to Auro Wallet.
   * Requests accounts and reads the current network.
   */
  const connect = async (): Promise<void> => {
    state.value.error = null;

    if (typeof window === 'undefined') return;

    if (!window.mina) {
      state.value.error =
        'Auro Wallet not detected. Install it from https://www.aurowallet.com/';
      return;
    }

    try {
      const accounts = await window.mina.requestAccounts();
      if (!accounts || accounts.length === 0) {
        state.value.error = 'No accounts returned from wallet';
        return;
      }
      state.value.address = accounts[0];
      state.value.connected = true;

      // Fetch network ID
      try {
        const net = await window.mina.requestNetwork();
        state.value.network = net?.networkID ?? 'unknown';
      } catch {
        state.value.network = 'unknown';
      }
    } catch (e: any) {
      state.value.error = e?.message ?? 'Failed to connect wallet';
    }
  };

  /**
   * Disconnect — local state only.
   * Auro Wallet has no programmatic disconnect; the user must revoke manually.
   */
  const disconnect = (): void => {
    state.value = {
      connected: false,
      address: null,
      network: null,
      error: null,
    };
  };

  /**
   * Send a proved o1js transaction via Auro Wallet.
   * The transaction must already be proved before calling this.
   *
   * @param tx — o1js Transaction object (after `.prove()`)
   * @param feeNanoMina — fee in nanomina (default: 0.1 MINA)
   */
  const sendTransaction = async (
    tx: any,
    feeNanoMina: number = 100_000_000
  ): Promise<string> => {
    if (typeof window === 'undefined' || !window.mina) {
      throw new Error('Auro Wallet not available');
    }
    if (!state.value.address) {
      throw new Error('Wallet not connected');
    }

    const result = await window.mina.sendTransaction({
      transaction: tx.toJSON(),
      feePayer: { fee: feeNanoMina },
    });

    return result.hash;
  };

  /**
   * Load o1js + all four zkApp contract instances in one call.
   * Uses dynamic imports so the initial page load stays fast.
   */
  const loadContracts = async () => {
    const o1js = await import('o1js');
    const { Mina, PublicKey } = o1js;

    const { PropertyNFT } = await import('@contracts/PropertyNFT');
    const { RentalAgreement } = await import('@contracts/RentalAgreement');
    const { RentalHistory } = await import('@contracts/RentalHistory');
    const { RentalOracle } = await import('@contracts/RentalOracle');

    // Configure Mina Devnet
    const Network = Mina.Network(config.public.networkUrl as string);
    Mina.setActiveInstance(Network);

    const nft = new PropertyNFT(
      PublicKey.fromBase58(config.public.propertyNFT as string)
    );
    const agreement = new RentalAgreement(
      PublicKey.fromBase58(config.public.rentalAgreement as string)
    );
    const history = new RentalHistory(
      PublicKey.fromBase58(config.public.rentalHistory as string)
    );
    const oracle = new RentalOracle(
      PublicKey.fromBase58(config.public.rentalOracle as string)
    );

    return { o1js, Mina, PublicKey, nft, agreement, history, oracle };
  };

  return {
    // state
    state,
    hasWallet,
    address,
    connected,
    network,
    shortAddress,
    // actions
    connect,
    disconnect,
    sendTransaction,
    loadContracts,
  };
};