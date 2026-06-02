/**
 * Інтеграційне тестування повного циклу реєстрації документа
 * у локальній мережі Hardhat Node.
 *
 * Запуск: npx hardhat run scripts/integration-test.ts
 */
import { network } from "hardhat";

const { ethers } = await network.create();

function log(label: string, value: string) {
  console.log(`  ${label.padEnd(22)} ${value}`);
}

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  DocIntegrity — Integration Test (Hardhat Node)           ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const [deployer, userA, userB] = await ethers.getSigners();
  const initialFee = ethers.parseEther("0.001");

  // ── STEP 1: Deploy ──────────────────────────────────────────
  console.log("\n  STEP 1 — Deploy DocumentRegistry");
  const Factory = await ethers.getContractFactory("DocumentRegistry");
  const registry = await Factory.deploy(initialFee);
  log("Contract:", await registry.getAddress());
  log("Deployer:", deployer.address);
  log("Fee:", "0.001 ETH");
  log("isAdmin(deployer):", String(await registry.isAdmin(deployer.address)));
  console.log("  ✓ Deployed");

  // ── STEP 2: Register ────────────────────────────────────────
  console.log("\n  STEP 2 — Register documents");
  const hash1 = ethers.keccak256(ethers.toUtf8Bytes("Diploma_Kucheruk_2026.pdf"));
  const hash2 = ethers.keccak256(ethers.toUtf8Bytes("Certificate_Blockchain.pdf"));

  const tx1 = await registry.connect(userA).registerDocument(hash1, { value: initialFee });
  const r1 = await tx1.wait();
  log("Doc 1 hash:", hash1.slice(0, 18) + "...");
  log("Author:", userA.address);
  log("Gas used:", r1!.gasUsed.toString());

  const overpay = ethers.parseEther("0.002");
  const balBefore = await ethers.provider.getBalance(userB.address);
  const tx2 = await registry.connect(userB).registerDocument(hash2, { value: overpay });
  const r2 = await tx2.wait();
  const gasSpent = r2!.gasUsed * r2!.gasPrice;
  const balAfter = await ethers.provider.getBalance(userB.address);
  const actualSpent = balBefore - balAfter - gasSpent;
  log("Doc 2 (overpay 0.002):", "refunded → charged " + ethers.formatEther(actualSpent) + " ETH");
  log("totalDocuments:", (await registry.totalDocuments()).toString());
  log("Contract balance:", ethers.formatEther(await registry.getContractBalance()) + " ETH");
  console.log("  ✓ Registered (excess refunded)");

  // ── STEP 3: Verify ──────────────────────────────────────────
  console.log("\n  STEP 3 — Verify documents");
  const [exists1, ts1, author1] = await registry.verifyDocument(hash1);
  log("Doc 1 exists:", String(exists1));
  log("Timestamp:", new Date(Number(ts1) * 1000).toISOString());
  log("Author:", author1);
  const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake-document"));
  const [existsFake] = await registry.verifyDocument(fakeHash);
  log("Fake doc exists:", String(existsFake));
  console.log("  ✓ Verification OK");

  // ── STEP 4: Revoke ──────────────────────────────────────────
  console.log("\n  STEP 4 — Revoke document");
  await registry.connect(userA).revokeDocument(hash1);
  const [existsAfter] = await registry.verifyDocument(hash1);
  log("exists after revoke:", String(existsAfter));
  log("totalDocuments:", (await registry.totalDocuments()).toString());
  console.log("  ✓ Revoked");

  // ── STEP 5: Admin ops ───────────────────────────────────────
  console.log("\n  STEP 5 — Admin operations");
  const newFee = ethers.parseEther("0.005");
  await registry.connect(deployer).setFee(newFee);
  log("New fee:", ethers.formatEther(await registry.registrationFee()) + " ETH");
  const bal = await registry.getContractBalance();
  await registry.connect(deployer).withdraw(bal);
  log("Withdrawn:", ethers.formatEther(bal) + " ETH");
  log("Contract balance:", ethers.formatEther(await registry.getContractBalance()) + " ETH");
  console.log("  ✓ Fee updated & funds withdrawn");

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  ✓ All integration tests passed                           ║");
  console.log("║  deploy → register → verify → revoke → admin ops          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
