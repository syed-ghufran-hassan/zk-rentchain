 
import {
  Field,
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  MerkleMap,
  MerkleMapWitness,
  Poseidon,
  DeployArgs,
} from 'o1js';

export class PropertyNFT extends SmartContract {
  @state(Field) ownerRoot = State<Field>();
  @state(Field) metadataRoot = State<Field>();
  @state(Field) nextTokenId = State<Field>();

  events = {
    propertyRegistered: Field,
    propertyTransferred: Field,
  };

  async deploy(args?: DeployArgs) {
    await super.deploy(args);
    this.ownerRoot.set(new MerkleMap().getRoot());
    this.metadataRoot.set(new MerkleMap().getRoot());
    this.nextTokenId.set(Field(1));
  }

  @method async registerProperty(
    ownerPublicKey: PublicKey,
    metadataHash: Field,
    ownerWitness: MerkleMapWitness,
    metadataWitness: MerkleMapWitness
  ) {
    const sender = this.sender.getAndRequireSignature();
    sender.assertEquals(ownerPublicKey);

    const currentOwnerRoot = this.ownerRoot.getAndRequireEquals();
    const currentMetadataRoot = this.metadataRoot.getAndRequireEquals();

    const [computedOwnerRoot, ownerKey] = ownerWitness.computeRootAndKey(Field(0));
    computedOwnerRoot.assertEquals(currentOwnerRoot);
    ownerKey.assertEquals(Poseidon.hash(ownerPublicKey.toFields()));

    const tokenId = this.nextTokenId.getAndRequireEquals();

    const [computedMetadataRoot, metaKey] = metadataWitness.computeRootAndKey(Field(0));
    computedMetadataRoot.assertEquals(currentMetadataRoot);
    metaKey.assertEquals(tokenId);

    const [newOwnerRoot] = ownerWitness.computeRootAndKey(tokenId);
    const [newMetadataRoot] = metadataWitness.computeRootAndKey(metadataHash);

    this.ownerRoot.set(newOwnerRoot);
    this.metadataRoot.set(newMetadataRoot);
    this.nextTokenId.set(tokenId.add(1));

    this.emitEvent('propertyRegistered', tokenId);
  }

  @method async proveOwnership(
    tokenId: Field,
    owner: PublicKey,
    witness: MerkleMapWitness
  ) {
    const currentRoot = this.ownerRoot.getAndRequireEquals();
    const [computedRoot, key] = witness.computeRootAndKey(tokenId);
    computedRoot.assertEquals(currentRoot);
    key.assertEquals(Poseidon.hash(owner.toFields()));
  }
}
 