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
  let wallet, controler, gracePeriodBlocks, ownerID, heirID, walletAmount, signer;

  beforeEach(async function () {
    signer = (await ethers.getSigners())[0];

    controler = signer.address;
    gracePeriodBlocks = 10;
    ownerID = 1;
    heirID = 2;

    walletAmount = ethers.utils.parseEther("1");

    const Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy(controler, gracePeriodBlocks, ownerID, heirID, { value: walletAmount });

    wallet.deployed();

    console.log(
      `Wallet contract deployed to ${wallet.address}`
    );
  });

  it("Should init controller change", async () => {
    const chainId = await signer.getChainId();
    const ownerID = 1;
    const newOwnerID = 2;
    const walletAddress = wallet.address;

    const typedData = {
      types: {
        InheritanceMessage: [
          { name: 'ownerID', type: 'uint256' },
          { name: 'ownerAddress', type: 'address' },
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
        ownerID,
        ownerAddress: walletAddress,
      },
    };

    console.log("signer address (tests): " + signer.address);
    const signature = await signer._signTypedData(typedData.domain, typedData.types, typedData.message);
    console.log("signature (tests): " + signature);
    const splitedSignature = splitSignature(signature);
    const newController = (await ethers.getSigners())[1].address;

    await wallet.initControllerChange(
      newController,
      newOwnerID,
      { ownerID: 1, ownerAddress: wallet.address },
      splitedSignature.r,
      splitedSignature.s,
      splitedSignature.v,
    );

    const pendingOwnerID = await wallet.pendingOwnerID();
    expect(pendingOwnerID).to.equal(newOwnerID);
  });
});
