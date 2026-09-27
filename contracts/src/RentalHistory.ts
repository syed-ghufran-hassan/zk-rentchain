 
import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  UInt64,
  MerkleMap,
  MerkleMapWitness,
  Poseidon,
  DeployArgs,
} from 'o1js';

export class RentalHistory extends SmartContract {
  @state(Field) ownerRoot = State<Field>();
  @state(Field) tenantRoot = State<Field>();
  @state(Field) agreementRoot = State<Field>();

  events = {
    agreementRecorded: Field,
    paymentRecorded: Field,
    endRecorded: Field,
    disputeRecorded: Field,
  };

  async deploy(args?: DeployArgs) {
    await super.deploy(args);
    this.ownerRoot.set(new MerkleMap().getRoot());
    this.tenantRoot.set(new MerkleMap().getRoot());
    this.agreementRoot.set(new MerkleMap().getRoot());
  }

  @method async recordAgreement(
    agreement: PublicKey,
    owner: PublicKey,
    tenant: PublicKey,
    rent: UInt64,
    deposit: UInt64,
    duration: UInt64,
    agreementWitness: MerkleMapWitness
  ) {
    const recordHash = Poseidon.hash([
      ...agreement.toFields(),
      ...owner.toFields(),
      ...tenant.toFields(),
      ...rent.toFields(),
      ...deposit.toFields(),
      ...duration.toFields(),
    ]);

    const currentAgreementRoot = this.agreementRoot.getAndRequireEquals();
    const [computedRoot, key] = agreementWitness.computeRootAndKey(Field(0));
    computedRoot.assertEquals(currentAgreementRoot);
    key.assertEquals(Poseidon.hash(agreement.toFields()));

    const [newAgreementRoot] = agreementWitness.computeRootAndKey(recordHash);
    this.agreementRoot.set(newAgreementRoot);

    this.emitEvent('agreementRecorded', Poseidon.hash(agreement.toFields()));
  }

  @method async recordPayment(agreement: PublicKey, amount: UInt64) {
    this.emitEvent('paymentRecorded', Poseidon.hash(agreement.toFields()));
  }

  @method async recordEnd(agreement: PublicKey) {
    this.emitEvent('endRecorded', Poseidon.hash(agreement.toFields()));
  }

  @method async recordDispute(agreement: PublicKey) {
    this.emitEvent('disputeRecorded', Poseidon.hash(agreement.toFields()));
  }
}
 