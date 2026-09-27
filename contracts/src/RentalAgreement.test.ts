import { Field, Mina, PrivateKey, PublicKey, UInt64, AccountUpdate } from 'o1js';
import { RentalAgreement, AgreementState } from './RentalAgreement.js';

describe('RentalAgreement', () => {
  let deployer: PrivateKey;
  let owner: PrivateKey;
  let tenant: PrivateKey;
  let zkAppKey: PrivateKey;
  let zkApp: RentalAgreement;

  const RENT = UInt64.from(1000000000);
  const DEPOSIT = UInt64.from(2000000000);
  const DURATION = UInt64.from(30 * 24 * 60 * 60);
  const INTERVAL = UInt64.from(24 * 60 * 60);

  beforeAll(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);

    // o1js v2: TestPublicKey.key gives the PrivateKey
    deployer = Local.testAccounts[0].key;
    owner = Local.testAccounts[1].key;
    tenant = Local.testAccounts[2].key;

    await RentalAgreement.compile();
  });

  beforeEach(async () => {
    zkAppKey = PrivateKey.random();
    zkApp = new RentalAgreement(zkAppKey.toPublicKey());

    const tx = await Mina.transaction(deployer.toPublicKey(), async () => {
      AccountUpdate.fundNewAccount(deployer.toPublicKey());
      await zkApp.deploy({
        owner: owner.toPublicKey(),
        tenant: tenant.toPublicKey(),
        rentAmount: RENT,
        depositAmount: DEPOSIT,
        leaseDuration: DURATION,
        paymentInterval: INTERVAL,
        propertyNFTAddress: PublicKey.empty(),
        propertyNFTId: Field(1),
      });
    });
    await tx.prove();
    await tx.sign([deployer, zkAppKey]).send();
  });

  it('starts in Created state', async () => {
    const state = await zkApp.getStatus();
    expect(state.toString()).toEqual(Field(AgreementState.Created).toString());
  });

  it('allows owner to sign', async () => {
    const tx = await Mina.transaction(owner.toPublicKey(), async () => {
      await zkApp.signAsOwner();
    });
    await tx.prove();
    await tx.sign([owner]).send();

    const state = await zkApp.getStatus();
    expect(state.toString()).toEqual(Field(AgreementState.OwnerSigned).toString());
  });

  it('activates when both parties sign', async () => {
    let tx = await Mina.transaction(owner.toPublicKey(), async () => {
      await zkApp.signAsOwner();
    });
    await tx.prove();
    await tx.sign([owner]).send();

    tx = await Mina.transaction(tenant.toPublicKey(), async () => {
      await zkApp.signAsTenant(DEPOSIT);
    });
    await tx.prove();
    await tx.sign([tenant]).send();

    const state = await zkApp.getStatus();
    expect(state.toString()).toEqual(Field(AgreementState.Active).toString());
  });

 it('rejects non-owner signing', async () => {
  await expect(
    Mina.transaction(tenant.toPublicKey(), async () => {
      await zkApp.signAsOwner();
    })
  ).rejects.toThrow();
});

it('rejects wrong deposit amount', async () => {
  let tx = await Mina.transaction(owner.toPublicKey(), async () => {
    await zkApp.signAsOwner();
  });
  await tx.prove();
  await tx.sign([owner]).send();

  await expect(
    Mina.transaction(tenant.toPublicKey(), async () => {
      await zkApp.signAsTenant(UInt64.from(1));
    })
  ).rejects.toThrow();
});
});