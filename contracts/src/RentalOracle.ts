 
import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  Bool,
  Poseidon,
  DeployArgs,
} from 'o1js';

export class RentalOracle extends SmartContract {
  @state(PublicKey) admin = State<PublicKey>();
  @state(Field) subscriptionId = State<Field>();

  events = {
    inspectionRequested: Field,
    inspectionResult: Field,
  };

  async deploy(args: DeployArgs & { admin: PublicKey; subscriptionId: Field }) {
    await super.deploy(args);
    this.admin.set(args.admin);
    this.subscriptionId.set(args.subscriptionId);
  }

  @method async requestInspection(agreement: PublicKey) {
    this.emitEvent('inspectionRequested', Poseidon.hash(agreement.toFields()));
  }

  @method async handleInspectionResult(
    agreement: PublicKey,
    passed: Bool,
    _signature: Field
  ) {
    const sender = this.sender.getAndRequireSignature();
    const admin = this.admin.getAndRequireEquals();
    sender.assertEquals(admin);

    this.emitEvent('inspectionResult', Poseidon.hash(agreement.toFields()));
  }
}
 