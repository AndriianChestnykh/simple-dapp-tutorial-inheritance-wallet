const { ethers } = require("hardhat");

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Wallet", function () {
  describe("Deployment", function () {
    it("should deploy wallet", async () => {
      const controler = (await ethers.getSigners())[0].address;
      const gracePeriodBlocks = 10;
      const ownerID = 1;
      const heirID = 2;

      const walletAmount = ethers.utils.parseEther("1");

      const Wallet = await ethers.getContractFactory("Wallet");
      const wallet = await Wallet.deploy(controler, gracePeriodBlocks, ownerID, heirID, { value: walletAmount });

      await wallet.deployed();

      console.log(
        `Wallet contract deployed to ${wallet.address}`
      );
    });
  });
});
