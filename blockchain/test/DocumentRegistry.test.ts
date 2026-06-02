import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("DocumentRegistry", function () {
  const initialFee = ethers.parseEther("0.001");

  async function deployFixture() {
    const [owner, user, attacker] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DocumentRegistry");
    const registry = await Factory.deploy(initialFee);
    return { registry, initialFee, owner, user, attacker };
  }

  // ─── Конструктор ─────────────────────────────────────────
  describe("Constructor", function () {
    it("Deployer receives DEFAULT_ADMIN_ROLE and ADMIN_ROLE", async function () {
      const { registry, owner } = await deployFixture();
      expect(await registry.isAdmin(owner.address)).to.equal(true);
      expect(await registry.isSuperAdmin(owner.address)).to.equal(true);
    });

    it("Initial registrationFee equals constructor parameter (0.001 ETH)", async function () {
      const { registry } = await deployFixture();
      expect(await registry.registrationFee()).to.equal(initialFee);
    });
  });

  // ─── registerDocument (успіх) ────────────────────────────
  describe("registerDocument (success)", function () {
    it("Registration saves hash, timestamp and author in mapping", async function () {
      const { registry, user } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Test Document Content"));

      await registry.connect(user).registerDocument(docHash, { value: initialFee });

      const [isRegistered, timestamp, author] = await registry.verifyDocument(docHash);
      expect(isRegistered).to.equal(true);
      expect(timestamp).to.be.greaterThan(0n);
      expect(author).to.equal(user.address);
    });

    it("Emits DocumentRegistered event with correct arguments", async function () {
      const { registry, user } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Event Test Document"));

      await expect(
        registry.connect(user).registerDocument(docHash, { value: initialFee })
      )
        .to.emit(registry, "DocumentRegistered")
        .withArgs(docHash, () => true, user.address, initialFee);
    });

    it("Excess ETH (0.002 at fee 0.001) is refunded to sender", async function () {
      const { registry, owner } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Test Document Content"));
      const overpay = ethers.parseEther("0.002");

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await registry.registerDocument(docHash, { value: overpay });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      // Баланс зменшився лише на fee, а не на overpay
      const spent = balanceBefore - balanceAfter - gasUsed;
      expect(spent).to.equal(initialFee);
    });
  });

  // ─── registerDocument (помилка) ──────────────────────────
  describe("registerDocument (failure)", function () {
    it("Duplicate hash registration is rejected", async function () {
      const { registry, user } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Duplicate Test"));

      await registry.connect(user).registerDocument(docHash, { value: initialFee });

      await expect(
        registry.connect(user).registerDocument(docHash, { value: initialFee })
      ).to.be.revertedWith("Document already registered");
    });

    it("Registration with insufficient fee (0.0005 ETH) is rejected", async function () {
      const { registry, user } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Underpaid Document"));
      const lowFee = ethers.parseEther("0.0005");

      await expect(
        registry.connect(user).registerDocument(docHash, { value: lowFee })
      ).to.be.revertedWith("Insufficient fee");
    });
  });

  // ─── revokeDocument (успіх) ──────────────────────────────
  describe("revokeDocument (success)", function () {
    it("Author revokes document: exists changes to false", async function () {
      const { registry, user } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Revoke Test"));

      await registry.connect(user).registerDocument(docHash, { value: initialFee });
      await registry.connect(user).revokeDocument(docHash);

      const [isRegistered] = await registry.verifyDocument(docHash);
      expect(isRegistered).to.equal(false);
    });

    it("Emits DocumentRevoked event with correct arguments", async function () {
      const { registry, user } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Revoke Event Test"));

      await registry.connect(user).registerDocument(docHash, { value: initialFee });

      await expect(registry.connect(user).revokeDocument(docHash))
        .to.emit(registry, "DocumentRevoked")
        .withArgs(docHash, () => true, user.address);
    });
  });

  // ─── revokeDocument (помилка) ────────────────────────────
  describe("revokeDocument (failure)", function () {
    it("Third-party address cannot revoke another's document", async function () {
      const { registry, user, attacker } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Protected Document"));

      await registry.connect(user).registerDocument(docHash, { value: initialFee });

      await expect(
        registry.connect(attacker).revokeDocument(docHash)
      ).to.be.revertedWith("Only author can revoke");
    });
  });

  // ─── setFee (адмін) ──────────────────────────────────────
  describe("setFee (admin)", function () {
    it("Admin changes fee; FeeChanged event is emitted", async function () {
      const { registry, owner } = await deployFixture();
      const newFee = ethers.parseEther("0.005");

      await expect(registry.connect(owner).setFee(newFee))
        .to.emit(registry, "FeeChanged")
        .withArgs(initialFee, newFee, owner.address);

      expect(await registry.registrationFee()).to.equal(newFee);
    });
  });

  // ─── setFee (помилка) ────────────────────────────────────
  describe("setFee (failure)", function () {
    it("Regular user cannot change fee — AccessControl revert", async function () {
      const { registry, user } = await deployFixture();
      const newFee = ethers.parseEther("0.005");

      await expect(
        registry.connect(user).setFee(newFee)
      ).to.be.revert(ethers);
    });
  });

  // ─── withdraw (адмін) ────────────────────────────────────
  describe("withdraw (admin)", function () {
    it("Admin withdraws accumulated contract balance", async function () {
      const { registry, owner, user } = await deployFixture();
      const docHash1 = ethers.keccak256(ethers.toUtf8Bytes("Doc 1"));
      const docHash2 = ethers.keccak256(ethers.toUtf8Bytes("Doc 2"));

      // Два документи → контракт накопичує 2 × fee
      await registry.connect(user).registerDocument(docHash1, { value: initialFee });
      await registry.connect(user).registerDocument(docHash2, { value: initialFee });

      const contractBalance = await registry.getContractBalance();
      expect(contractBalance).to.equal(initialFee * 2n);

      await registry.connect(owner).withdraw(contractBalance);
      expect(await registry.getContractBalance()).to.equal(0n);
    });
  });

  // ─── withdraw (помилка) ──────────────────────────────────
  describe("withdraw (failure)", function () {
    it("Withdrawal without ADMIN_ROLE is rejected", async function () {
      const { registry, user } = await deployFixture();
      const docHash = ethers.keccak256(ethers.toUtf8Bytes("Funded Doc"));

      await registry.connect(user).registerDocument(docHash, { value: initialFee });

      await expect(
        registry.connect(user).withdraw(initialFee)
      ).to.be.revert(ethers);
    });
  });
});
