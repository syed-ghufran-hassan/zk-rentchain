import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  UInt64,
  Bool,
  Provable,
  DeployArgs,
} from 'o1js';

export enum AgreementState {
  Created = 0,
  OwnerSigned = 1,
  TenantSigned = 2,
  Active = 3,
  Ended = 4,
  Disputed = 5,
}

export class RentalAgreement extends SmartContract {
  @state(PublicKey) owner = State<PublicKey>();
  @state(PublicKey) tenant = State<PublicKey>();
  @state(UInt64) rentAmount = State<UInt64>();
  @state(UInt64) depositAmount = State<UInt64>();
  @state(UInt64) leaseDuration = State<UInt64>();
  @state(UInt64) paymentInterval = State<UInt64>();
  @state(UInt64) leaseStart = State<UInt64>();
  @state(UInt64) leaseEnd = State<UInt64>();
  @state(UInt64) lastPaymentTimestamp = State<UInt64>();
  @state(UInt64) depositHeld = State<UInt64>();
  @state(Field) stateHash = State<Field>();
  @state(Field) propertyNFTId = State<Field>();
  @state(PublicKey) propertyNFTAddress = State<PublicKey>();
  @state(Bool) depositReleased = State<Bool>();

  events = {
    agreementSigned: Field,
    rentPaid: UInt64,
    leaseEnded: UInt64,
    depositReleased: UInt64,
    disputeRaised: PublicKey,
  };

  async deploy(args: DeployArgs & {
    owner: PublicKey;
    tenant: PublicKey;
    rentAmount: UInt64;
    depositAmount: UInt64;
    leaseDuration: UInt64;
    paymentInterval: UInt64;
    propertyNFTAddress: PublicKey;
    propertyNFTId: Field;
  }) {
    await super.deploy(args);
    this.owner.set(args.owner);
    this.tenant.set(args.tenant);
    this.rentAmount.set(args.rentAmount);
    this.depositAmount.set(args.depositAmount);
    this.leaseDuration.set(args.leaseDuration);
    this.paymentInterval.set(args.paymentInterval);
    this.propertyNFTAddress.set(args.propertyNFTAddress);
    this.propertyNFTId.set(args.propertyNFTId);
    this.stateHash.set(Field(AgreementState.Created));
    this.depositReleased.set(Bool(false));
    this.depositHeld.set(UInt64.zero);
    this.leaseStart.set(UInt64.zero);
    this.leaseEnd.set(UInt64.zero);
    this.lastPaymentTimestamp.set(UInt64.zero);
  }

  @method async signAsOwner() {
    const sender = this.sender.getAndRequireSignature();
    const owner = this.owner.getAndRequireEquals();
    sender.assertEquals(owner);

    const currentState = this.stateHash.getAndRequireEquals();
    const isCreated = currentState.equals(Field(AgreementState.Created));
    const isTenantSigned = currentState.equals(Field(AgreementState.TenantSigned));
    isCreated.or(isTenantSigned).assertTrue();

    // Compute new state — Provable.if instead of JS if/else
    const newState = Provable.if(
      isCreated,
      Field(AgreementState.OwnerSigned),
      Field(AgreementState.Active)
    );
    this.stateHash.set(newState);

    // Activation side-effects: only applied when transitioning from TenantSigned
    const now = UInt64.from(Math.floor(Date.now() / 1000));
    const duration = this.leaseDuration.getAndRequireEquals();

    this.leaseStart.set(Provable.if(isCreated, UInt64.zero, now));
    this.leaseEnd.set(Provable.if(isCreated, UInt64.zero, now.add(duration)));
    this.lastPaymentTimestamp.set(Provable.if(isCreated, UInt64.zero, now));

    this.emitEvent('agreementSigned', newState);
  }

  @method async signAsTenant(deposit: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    const tenant = this.tenant.getAndRequireEquals();
    sender.assertEquals(tenant);

    const depositAmount = this.depositAmount.getAndRequireEquals();
    deposit.assertEquals(depositAmount);

    const currentState = this.stateHash.getAndRequireEquals();
    const isCreated = currentState.equals(Field(AgreementState.Created));
    const isOwnerSigned = currentState.equals(Field(AgreementState.OwnerSigned));
    isCreated.or(isOwnerSigned).assertTrue();

    this.depositHeld.set(deposit);

    const newState = Provable.if(
      isCreated,
      Field(AgreementState.TenantSigned),
      Field(AgreementState.Active)
    );
    this.stateHash.set(newState);

    const now = UInt64.from(Math.floor(Date.now() / 1000));
    const duration = this.leaseDuration.getAndRequireEquals();

    this.leaseStart.set(Provable.if(isCreated, UInt64.zero, now));
    this.leaseEnd.set(Provable.if(isCreated, UInt64.zero, now.add(duration)));
    this.lastPaymentTimestamp.set(Provable.if(isCreated, UInt64.zero, now));

    this.emitEvent('agreementSigned', newState);
  }

  @method async payRent(amount: UInt64) {
    const sender = this.sender.getAndRequireSignature();
    const tenant = this.tenant.getAndRequireEquals();
    sender.assertEquals(tenant);

    const currentState = this.stateHash.getAndRequireEquals();
    currentState.assertEquals(Field(AgreementState.Active));

    const rentAmount = this.rentAmount.getAndRequireEquals();
    amount.assertEquals(rentAmount);

    this.lastPaymentTimestamp.set(UInt64.from(Math.floor(Date.now() / 1000)));
    this.emitEvent('rentPaid', amount);
  }

  @method async endLease() {
    const sender = this.sender.getAndRequireSignature();
    const owner = this.owner.getAndRequireEquals();
    sender.assertEquals(owner);

    const currentState = this.stateHash.getAndRequireEquals();
    currentState.assertEquals(Field(AgreementState.Active));

    this.stateHash.set(Field(AgreementState.Ended));
    this.emitEvent('leaseEnded', UInt64.from(Math.floor(Date.now() / 1000)));
  }

  @method async releaseDeposit() {
    const depositReleased = this.depositReleased.getAndRequireEquals();
    depositReleased.assertFalse();

    const currentState = this.stateHash.getAndRequireEquals();
    currentState.assertEquals(Field(AgreementState.Ended));

    const deposit = this.depositHeld.getAndRequireEquals();
    deposit.assertGreaterThan(UInt64.zero);

    this.depositReleased.set(Bool(true));
    this.depositHeld.set(UInt64.zero);
    this.emitEvent('depositReleased', deposit);
  }

  @method async disputeDeposit() {
    const sender = this.sender.getAndRequireSignature();
    const owner = this.owner.getAndRequireEquals();
    const tenant = this.tenant.getAndRequireEquals();
    sender.equals(owner).or(sender.equals(tenant)).assertTrue();

    const currentState = this.stateHash.getAndRequireEquals();
    currentState.assertEquals(Field(AgreementState.Ended));

    this.stateHash.set(Field(AgreementState.Disputed));
    this.emitEvent('disputeRaised', sender);
  }

  @method.returns(Field)
  async getStatus(): Promise<Field> {
    return this.stateHash.getAndRequireEquals();
  }

}
 