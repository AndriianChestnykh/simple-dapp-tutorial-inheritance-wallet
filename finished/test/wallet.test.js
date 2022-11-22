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

  const tokenERC20Supply = 1000;
  const TokenERC20 = await ethers.getContractFactory("GLDToken");
  const tokenERC20 = await TokenERC20.deploy(wallet.address, tokenERC20Supply);
  tokenERC20.deployed();

  const TokenERC721 = await ethers.getContractFactory("GameItem");
  const tokenERC721 = await TokenERC721.deploy();
  tokenERC721.deployed();
  await tokenERC721.awardItem(wallet.address, "https://game.example/item-id-1.json");
  await tokenERC721.awardItem(wallet.address, "https://game.example/item-id-2.json");
  await tokenERC721.awardItem(wallet.address, "https://game.example/item-id-3.json");

  return { wallet, gracePeriodBlocks, walletAmount, tokenERC20, tokenERC721, ownerSigner, heirSigner, receiverSigner }
}

async function checkCanSend(wallet, signer, receiverSigner, amount, tokenId, tokenERC20, tokenERC721) {
  await expect(
    wallet.connect(signer).send(receiverSigner.address, amount)
  ).to.changeEtherBalance(receiverSigner, amount);

  await expect(
    wallet.connect(signer).transferERC20(tokenERC20.address, receiverSigner.address, 10)
  ).to.changeTokenBalance(tokenERC20, receiverSigner, 10);

  await wallet.connect(signer).transferERC721(tokenERC721.address, receiverSigner.address, tokenId);
  expect(await tokenERC721.ownerOf(tokenId)).to.be.equal(receiverSigner.address);
}

async function checkCanNotSend(wallet, signer, receiverSigner, amount, tokenId, tokenERC20, tokenERC721) {
  await expect(
    wallet.connect(signer).send(receiverSigner.address, amount)
  ).to.be.revertedWith("Controller check failed");

  await expect(
    wallet.connect(signer).transferERC20(tokenERC20.address, receiverSigner.address, 10)
  ).to.be.revertedWith("Controller check failed");

  await expect(
    wallet.connect(signer).transferERC721(tokenERC721.address, receiverSigner.address, tokenId)
  ).to.be.revertedWith("Controller check failed");
}

describe("Wallet life cycle", function () {
  let wallet, gracePeriodBlocks, walletAmount, tokenERC20, tokenERC721, ownerSigner, heirSigner, receiverSigner;
  let pendingControllerCommitBlock;

  before(async function () {
    ({ wallet, gracePeriodBlocks, walletAmount, tokenERC20, tokenERC721, ownerSigner, heirSigner, receiverSigner }
      = await loadFixture(deployWalletFixture)
    );
  });

  it("Owner can send any assets", async () => {
    const amount = ethers.utils.parseEther("0.1");
    const tokenId = 0;
    await checkCanSend(wallet, ownerSigner, receiverSigner, amount, tokenId, tokenERC20, tokenERC721);
  });

  it("Heir can't send any assets", async () => {
    const amount = ethers.utils.parseEther("0.1");
    let tokenId = 1;
    await checkCanNotSend(wallet, heirSigner, receiverSigner, amount, tokenId, tokenERC20, tokenERC721);
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

    await expect(
      wallet.connect(heirSigner).transferERC20(tokenERC20.address, receiverSigner.address, 10)
    ).to.be.revertedWith("Controller check failed");

    let tokenId = 1;
    await expect(
      wallet.connect(heirSigner).transferERC721(tokenERC721.address, receiverSigner.address, tokenId)
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
    const tokenId = 1;
    await checkCanSend(wallet, heirSigner, receiverSigner, amount, tokenId, tokenERC20, tokenERC721);
  });

  it("Owner can't send any assets", async () => {
    const amount = ethers.utils.parseEther("0.1");
    const tokenId = 2;
    await checkCanNotSend(wallet, ownerSigner, receiverSigner, amount, tokenId, tokenERC20, tokenERC721);
  });
});
