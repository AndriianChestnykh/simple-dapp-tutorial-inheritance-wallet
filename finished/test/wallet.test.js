const { ethers } = require("hardhat");

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { splitSignature } = require("ethers/lib/utils");
const { recoverTypedSignature, recoverTypedSignature_v4, signTypedData } = require("eth-sig-util");

describe("Wallet", function () {
  let wallet, controler, gracePeriodBlocks, walletAmount, ownerSigner, heirSigner;

  beforeEach(async function () {
    ownerSigner = (await ethers.getSigners())[0];
    heirSigner = (await ethers.getSigners())[1];

    controler = ownerSigner.address;
    gracePeriodBlocks = 10;

    walletAmount = ethers.utils.parseEther("1");

    const Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy(controler, gracePeriodBlocks, { value: walletAmount });
    wallet.deployed();

    console.log(
      `Wallet contract deployed to ${wallet.address}`
    );
  });

  it("Should init controller change", async () => {
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

    console.log("signer address (tests): " + ownerSigner.address);
    const signature = await ownerSigner._signTypedData(typedData.domain, typedData.types, typedData.message);
    console.log("signature (tests): " + signature);
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
  });
});
