// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const controler = (await hre.ethers.getSigners())[0].address;
  const gracePeriodBlocks = 10;

  const walletAmount = hre.ethers.utils.parseEther("1");

  const Wallet = await hre.ethers.getContractFactory("Wallet");
  const wallet = await Wallet.deploy(controler, gracePeriodBlocks, { value: walletAmount });

  await wallet.deployed();

  console.log(
    `Wallet contract deployed to ${wallet.address}`
  );

  fs.writeFileSync("./walletAddress.json", JSON.stringify({ address: wallet.address }));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
