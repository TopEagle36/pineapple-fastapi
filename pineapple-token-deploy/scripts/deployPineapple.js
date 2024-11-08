// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const dex = await hre.ethers.deployContract("StandardToken", ['Pineapple', "PA", 18, 1000000000000000000000000000n]);

  await dex.waitForDeployment();

  console.log(
    ` deployed to ${dex.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// deployed to : 0xD709214976C04c9FdAd1AB59138e7679833D62dC //base sepolia