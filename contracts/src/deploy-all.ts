import {
  Mina,
  PrivateKey,
  PublicKey,
  UInt64,
  Field,
  AccountUpdate,
  fetchAccount,
} from 'o1js';
import * as fs from 'fs';
import { PropertyNFT } from './PropertyNFT.js';
import { RentalHistory } from './RentalHistory.js';
import { RentalOracle } from './RentalOracle.js';
import { RentalAgreement } from './RentalAgreement.js';

const NETWORK_URL = 'https://devnet-plain-1.gcp.o1test.net/graphql';
const FEE = 100_000_000; // 0.1 MINA in nanomina

async function waitAndFetch(publicKey: PublicKey, label: string) {
  console.log(`  Waiting for ${label} to be included in a block...`);
  // Fetch account state after waiting (o1js automatically retries for a few blocks)
  await fetchAccount({ publicKey });
  console.log(`  ${label} confirmed. Nonce updated.`);
}

async function main() {
  console.log('=== Compiling contracts ===');
  await PropertyNFT.compile();
  await RentalHistory.compile();
  await RentalOracle.compile();
  await RentalAgreement.compile();

  console.log('=== Connecting to Mina Devnet ===');
  const Network = Mina.Network(NETWORK_URL);
  Mina.setActiveInstance(Network);

  const deployerKey = PrivateKey.fromBase58(process.env.DEPLOYER_KEY!);
  const deployer = deployerKey.toPublicKey();
  console.log('Deployer:', deployer.toBase58());

  await fetchAccount({ publicKey: deployer });
  const balance = Mina.getBalance(deployer);
  console.log('Balance:', balance.toString(), 'nanomina');

  const feePayer = { sender: deployer, fee: FEE };
  const manifest: Record<string, string> = {};

  // --- 1. PropertyNFT ---
  console.log('\n=== Deploying PropertyNFT ===');
  const nftKey = PrivateKey.random();
  const nft = new PropertyNFT(nftKey.toPublicKey());
  let tx = await Mina.transaction(feePayer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await nft.deploy({});
  });
  await tx.prove();
  await tx.sign([deployerKey, nftKey]).send().wait();
  manifest.PropertyNFT = nftKey.toPublicKey().toBase58();
  console.log('PropertyNFT:', manifest.PropertyNFT);
  await waitAndFetch(deployer, 'PropertyNFT deploy');

  // --- 2. RentalHistory ---
  console.log('\n=== Deploying RentalHistory ===');
  const historyKey = PrivateKey.random();
  const history = new RentalHistory(historyKey.toPublicKey());
  tx = await Mina.transaction(feePayer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await history.deploy({});
  });
  await tx.prove();
  await tx.sign([deployerKey, historyKey]).send().wait();
  manifest.RentalHistory = historyKey.toPublicKey().toBase58();
  console.log('RentalHistory:', manifest.RentalHistory);
  await waitAndFetch(deployer, 'RentalHistory deploy');

  // --- 3. RentalOracle ---
  console.log('\n=== Deploying RentalOracle ===');
  const oracleKey = PrivateKey.random();
  const oracle = new RentalOracle(oracleKey.toPublicKey());
  tx = await Mina.transaction(feePayer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await oracle.deploy({ admin: deployer, subscriptionId: Field(1) });
  });
  await tx.prove();
  await tx.sign([deployerKey, oracleKey]).send().wait();
  manifest.RentalOracle = oracleKey.toPublicKey().toBase58();
  console.log('RentalOracle:', manifest.RentalOracle);
  await waitAndFetch(deployer, 'RentalOracle deploy');

  // --- 4. RentalAgreement ---
  console.log('\n=== Deploying RentalAgreement ===');
  const agreementKey = PrivateKey.random();
  const tenantKey = PrivateKey.random();
  const agreement = new RentalAgreement(agreementKey.toPublicKey());
  tx = await Mina.transaction(feePayer, async () => {
    AccountUpdate.fundNewAccount(deployer);
    await agreement.deploy({
      owner: deployer,
      tenant: tenantKey.toPublicKey(),
      rentAmount: UInt64.from(1000000000),
      depositAmount: UInt64.from(2000000000),
      leaseDuration: UInt64.from(2592000),
      paymentInterval: UInt64.from(86400),
      propertyNFTAddress: nftKey.toPublicKey(),
      propertyNFTId: Field(1),
    });
  });
  await tx.prove();
  await tx.sign([deployerKey, agreementKey]).send().wait();
  manifest.RentalAgreement = agreementKey.toPublicKey().toBase58();
  manifest.Tenant = tenantKey.toPublicKey().toBase58();
  console.log('RentalAgreement:', manifest.RentalAgreement);
  console.log('Tenant:', manifest.Tenant);

  fs.writeFileSync('./deployed.json', JSON.stringify(manifest, null, 2));
  console.log('\n=== Deployment complete ===');
  console.log(manifest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});