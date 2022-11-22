const { ethers } = require("hardhat");

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { splitSignature } = require("ethers/lib/utils");
const { recoverTypedSignature, recoverTypedSignature_v4, signTypedData } = require("eth-sig-util");
const { toHex } = require("hardhat/internal/util/bigint");

async function deployWalletFixture() {
  const [ownerSigner, heirSigner, receiverSigner] = await ethers.getSigners();
  const gracePeriodBlocks = 10;
  const walletAmount = ethers.utils.parseEther("1");

  const Wallet = await ethers.getContractFactory("Wallet");
  const wallet = await Wallet.deploy(ownerSigner.address, gracePeriodBlocks, { value: walletAmount });
  wallet.deployed();

  return { wallet, gracePeriodBlocks, walletAmount, ownerSigner, heirSigner, receiverSigner }
}

describe("Wallet life cycle", function () {
  let wallet, gracePeriodBlocks, walletAmount, ownerSigner, heirSigner, receiverSigner;
  let pendingControllerCommitBlock;

  before(async function () {
    ({ wallet, gracePeriodBlocks, walletAmount, ownerSigner, heirSigner, receiverSigner }
      = await loadFixture(deployWalletFixture)
    );
  });

  it("Owner can send any assets", async () => {
    const amount = ethers.utils.parseEther("0.1");
    await expect(
      wallet.connect(ownerSigner).send(receiverSigner.address, amount)
    ).to.changeEtherBalance(receiverSigner, amount);
  });

  it("Heir can't send any assets", async () => {
    const amount = ethers.utils.parseEther("0.1");
    await expect(
      wallet.connect(heirSigner).send(receiverSigner.address, amount)
    ).to.be.revertedWith("Controller check failed");
  });

  it("Heir can init controller change by IM", async () => {
    const chainId = await ownerSigner.getChainId();
    const walletAddress = wallet.address;

    const typedData = {
      types: {
        InheritanceMessage: [
          { name: 'heirAddress', type: 'address' },
        ],
      },
      primaryType: 'InheritanceMessage',
      domain: {
        name: 'InheritanceMessage',
        version: '1',
        chainId,
        verifyingContract: walletAddress,
      },
      message: {
        heirAddress: heirSigner.address,
      },
    };

    const signature = await ownerSigner._signTypedData(typedData.domain, typedData.types, typedData.message);
    const splitedSignature = splitSignature(signature);

    await wallet.connect(heirSigner).initControllerChange(
      heirSigner.address,
      { heirAddress: heirSigner.address },
      splitedSignature.r,
      splitedSignature.s,
      splitedSignature.v,
    );

    const pendingController = await wallet.pendingController();
    expect(pendingController).to.equal(heirSigner.address);

    pendingControllerCommitBlock = await wallet.pendingControllerCommitBlock();
    expect(pendingControllerCommitBlock).to.equal(await ethers.provider.getBlockNumber());
  });

  it("Heir can't send any assets yet", async () => {
    const amount = ethers.utils.parseEther("0.1");
    await expect(
      wallet.connect(heirSigner).send(receiverSigner.address, amount)
    ).to.be.revertedWith("Controller check failed");
  });

  it("Heir can't finalize controller change yet", async () => {
    await expect(
      wallet.connect(heirSigner).finalizeControllerChange()
    ).to.be.revertedWith("Grace period has not passed yet");
  });

  it("Heir can finalize controller change after the grace period", async () => {
    await time.advanceBlockTo( pendingControllerCommitBlock.toNumber() + gracePeriodBlocks);
    await wallet.connect(heirSigner).finalizeControllerChange();

    const controller = await wallet.controller();
    expect(controller).to.equal(heirSigner.address);
  });

  it("Heir can send any assets", async () => {
    const amount = ethers.utils.parseEther("0.1");
    await expect(
      wallet.connect(heirSigner).send(receiverSigner.address, amount)
    ).to.changeEtherBalance(receiverSigner, amount);
  });

  it("Owner can't send any assets", async () => {
    const amount = ethers.utils.parseEther("0.1");
    await expect(
      wallet.connect(ownerSigner).send(receiverSigner.address, amount)
    ).to.be.revertedWith("Controller check failed");
  });
});
