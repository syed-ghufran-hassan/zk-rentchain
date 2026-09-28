/**
 * usePropertyNFT — syncs the off-chain MerkleMap for PropertyNFT
 * from the on-chain root, generates witnesses, and builds transactions.
 */
import { ref, computed } from 'vue';

export interface PropertyRecord {
  tokenId: string;
  owner: string;
  metadataHash: string;
}

// In-memory cache of the off-chain MerkleMap
// Keyed by contract address — reset on page reload
const cache = new Map<string, { ownerMap: any; metadataMap: any }>();

export const usePropertyNFT = () => {
  const config = useRuntimeConfig();
  const { address } = useMina();

  const loading = ref(false);
  const error = ref('');
  const syncing = ref(false);

  /**
   * Fetch the on-chain roots for PropertyNFT and rebuild the
   * off-chain MerkleMaps from the event log (via MinaScan / GraphQL).
   */
  const syncMerkleMaps = async () => {
    syncing.value = true;
    error.value = '';

    try {
      const o1js = await import('o1js');
      const { Field, MerkleMap } = o1js;
      const { PropertyNFT } = await import('@contracts/PropertyNFT');
      const { Mina, PublicKey } = o1js;

      // Configure network
      const Network = Mina.Network(config.public.networkUrl);
      Mina.setActiveInstance(Network);

      const contractAddress = config.public.propertyNFT as string;
      if (!contractAddress) throw new Error('PROPERTY_NFT address not configured');

      const nft = new PropertyNFT(PublicKey.fromBase58(contractAddress));

      // 1. Fetch on-chain roots
      const ownerRoot = await nft.ownerRoot.fetch();
      const metadataRoot = await nft.metadataRoot.fetch();

      console.log('On-chain ownerRoot:', ownerRoot?.toString());
      console.log('On-chain metadataRoot:', metadataRoot?.toString());

      // 2. Query past PropertyRegistered events via GraphQL
      //    Each event contains the tokenId. We rebuild the maps by
      //    replaying events in order, computing the same keys and values
      //    the contract would have set.
      const events = await fetchPropertyEvents(contractAddress);

      const ownerMap = new MerkleMap();
      const metadataMap = new MerkleMap();

      for (const ev of events) {
        const tokenId = Field(ev.tokenId);
        const ownerKey = o1js.Poseidon.hash(
          PublicKey.fromBase58(ev.owner).toFields()
        );
        const metadataKey = tokenId;

        ownerMap.set(ownerKey, tokenId);
        metadataMap.set(metadataKey, Field(ev.metadataHash));
      }

      // 3. Verify roots match (sanity check)
      if (ownerRoot && ownerMap.getRoot().toString() !== ownerRoot.toString()) {
        console.warn('⚠️ Reconstructed owner root does not match on-chain root');
      }

      cache.set(contractAddress, { ownerMap, metadataMap });
      return { ownerMap, metadataMap, nft };
    } catch (e: any) {
      error.value = e?.message ?? 'MerkleMap sync failed';
      throw e;
    } finally {
      syncing.value = false;
    }
  };

  /**
   * Fetch PropertyRegistered events from Mina Devnet via GraphQL.
   * The Mina archive node exposes events; the Devnet endpoint we use
   * for transactions does not, so we query a public explorer API.
   */
  const fetchPropertyEvents = async (contractAddress: string): Promise<any[]> => {
    // Placeholder: query a Mina archive node or indexer API.
    // The o1Labs Devnet GraphQL does not expose historical events directly.
    // Options:
    //   1. Use Minascan's events API
    //   2. Run a local archive node
    //   3. Cache events client-side as users interact
    //
    // For the MVP, we return an empty list — the map is empty on first use.
    // New registrations are appended to the local cache.
    return [];
  };

  /**
   * Build + prove + send a registerProperty transaction.
   * @param metadataURI — arbitrary string (IPFS URI or description)
   */
  const registerProperty = async (metadataURI: string) => {
    loading.value = true;
    error.value = '';

    try {
      const o1js = await import('o1js');
      const { Field, Poseidon, Mina, PublicKey } = o1js;
      const { PropertyNFT } = await import('@contracts/PropertyNFT');

      if (!address.value) throw new Error('Wallet not connected');

      // Ensure maps are synced
      let maps = cache.get(config.public.propertyNFT as string);
      if (!maps) {
        const result = await syncMerkleMaps();
        maps = { ownerMap: result.ownerMap, metadataMap: result.metadataMap };
      }

      const { ownerMap, metadataMap } = maps;
      const contractAddress = config.public.propertyNFT as string;
      const nft = new PropertyNFT(PublicKey.fromBase58(contractAddress));

      // 1. Compute keys
      const ownerPubkey = PublicKey.fromBase58(address.value);
      const ownerKey = Poseidon.hash(ownerPubkey.toFields());
      const metadataHash = Poseidon.hash([Field(BigInt(hashString(metadataURI)))]);

      // 2. Get current nextTokenId from chain
      const nextTokenId = (await nft.nextTokenId.fetch()) ?? Field(1);
      const metadataKey = nextTokenId;

      // 3. Generate witnesses (before mutation)
      const ownerWitness = ownerMap.getWitness(ownerKey);
      const metadataWitness = metadataMap.getWitness(metadataKey);

      // 4. Build transaction
      const Network = Mina.Network(config.public.networkUrl);
      Mina.setActiveInstance(Network);

      const feePayer = { sender: PublicKey.fromBase58(address.value), fee: 100_000_000 };
      const tx = await Mina.transaction(feePayer, async () => {
        await nft.registerProperty(
          ownerPubkey,
          metadataHash,
          ownerWitness,
          metadataWitness
        );
      });

      // 5. Prove in-browser (30–60s)
      await tx.prove();

      // 6. Hand off to Auro Wallet for signing + broadcasting
      const txJson = tx.toJSON();
      if (!window.mina) throw new Error('Auro Wallet not available');
      const result = await window.mina.sendTransaction({
        transaction: txJson,
        feePayer: { fee: 100_000_000 },
      });

      // 7. Update local map (so next registration works without re-syncing)
      ownerMap.set(ownerKey, nextTokenId);
      metadataMap.set(metadataKey, metadataHash);

      return result.hash;
    } catch (e: any) {
      error.value = e?.message ?? 'Registration failed';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Simple string → bigint hash (not cryptographic, placeholder).
   * In production use a proper keccak or sha256 helper.
   */
  const hashString = (s: string): bigint => {
    let h = 0n;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31n + BigInt(s.charCodeAt(i))) & ((1n << 254n) - 1n);
    }
    return h;
  };

  return {
    loading,
    syncing,
    error,
    syncMerkleMaps,
    registerProperty,
  };
};
