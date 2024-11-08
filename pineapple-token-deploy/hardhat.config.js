require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-ethers");  
require('@openzeppelin/hardhat-upgrades');
require("@nomicfoundation/hardhat-verify");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
  //   solidity: {version: "0.8.4"},
  networks: {
    comai_testnet: {
      url: "https://testnet.api.communeai.net",
      chainId: 9461,
      accounts: ['b3ff77a2c8565dd6cd843f0ec25881ad337dc31556f48c7b95b11cf6e398ec24']
    }

  },
  // sourcify: {
  //     enabled: true
  //   }
};


// npx hardhat compile
// npx hardhat run --network bsc_testnet scripts/deploy.js

// verify cmd
// npx hardhat verify --constructor-args arguments.js DEPLOYED_CONTRACT_ADDRESS