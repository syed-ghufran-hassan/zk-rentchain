 
import { ref } from 'vue';

export const useAgreement = () => {
  const config = useRuntimeConfig();
  const { address } = useMina();

  const loading = ref(false);
  const error = ref('');

  /**
   * Generic method — build, prove, send for any RentalAgreement method
   * that takes no arguments (signAsOwner, endLease, releaseDeposit, disputeDeposit).
   */
  const callMethod = async (methodName: string) => {
    loading.value = true;
    error.value = '';

    try {
      const o1js = await import('o1js');
      const { Mina, PublicKey } = o1js;
      const { RentalAgreement } = await import('~/../contracts/src/RentalAgreement');

      if (!address.value) throw new Error('Wallet not connected');

      const Network = Mina.Network(config.public.networkUrl);
      Mina.setActiveInstance(Network);

      const contractAddress = config.public.rentalAgreement as string;
      const agreement = new RentalAgreement(PublicKey.fromBase58(contractAddress));

      const feePayer = {
        sender: PublicKey.fromBase58(address.value),
        fee: 100_000_000,
      };

      // Build transaction dynamically based on methodName
      const tx = await Mina.transaction(feePayer, async () => {
        switch (methodName) {
          case 'signAsOwner':
            await agreement.signAsOwner();
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
            throw new Error(`Unknown method: ${methodName}`);
        }
      });

      await tx.prove();

      if (!window.mina) throw new Error('Auro Wallet not available');
      const result = await window.mina.sendTransaction({
        transaction: tx.toJSON(),
        feePayer: { fee: 100_000_000 },
      });

      return result.hash;
    } catch (e: any) {
      error.value = e?.message ?? 'Transaction failed';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const signAsTenant = async (depositNanoMina: bigint) => {
    loading.value = true;
    error.value = '';

    try {
      const o1js = await import('o1js');
      const { Mina, PublicKey, UInt64 } = o1js;
      const { RentalAgreement } = await import('~/../contracts/src/RentalAgreement');

      if (!address.value) throw new Error('Wallet not connected');

      const Network = Mina.Network(config.public.networkUrl);
      Mina.setActiveInstance(Network);

      const agreement = new RentalAgreement(
        PublicKey.fromBase58(config.public.rentalAgreement as string)
      );

      const feePayer = {
        sender: PublicKey.fromBase58(address.value),
        fee: 100_000_000,
      };

      const tx = await Mina.transaction(feePayer, async () => {
        await agreement.signAsTenant(UInt64.from(depositNanoMina));
      });

      await tx.prove();

      const result = await window.mina!.sendTransaction({
        transaction: tx.toJSON(),
        feePayer: { fee: 100_000_000 },
      });

      return result.hash;
    } catch (e: any) {
      error.value = e?.message ?? 'Sign failed';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, callMethod, signAsTenant };
};
 