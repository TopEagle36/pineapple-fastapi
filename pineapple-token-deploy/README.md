# Commune EVM Integration Guide with Hardhat

## Overview

Commune's EVM (Ethereum Virtual Machine) compatibility allows developers to deploy and execute smart contracts using modern development tools like Hardhat. This guide covers the setup, development, and deployment process using Hardhat on Commune's testnet.

## Prerequisites

### Required Global Installations
```bash
npm install -g npm@latest
npm install -g hardhat
```

### Project Setup

1. Clone the repo and initialize:
```bash
npm init -y
```

1. Install required dependencies:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

1. Initialize Hardhat:
```bash
npx hardhat init
```
Select "Create a JavaScript project" when prompted.

### Environment Setup

Create a `.env` file in your project root:

```plaintext
PRIVATE_KEY=your_private_key_here_for_your_ethereum wallet
COMMUNE_RPC_URL=https://testnet.api.communeai.net
```
Make sure you have COMAI testnet tokens in your wallet.
You can read the first section on transferring tokens from your substrate wallet to your erc-20 address here: 
https://communeai.org/docs/subspace/evm then continue if you haven't done that already.

## Project Configuration

### Hardhat Config

Replace the contents of `hardhat.config.js` with:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COMMUNE_RPC_URL = process.env.COMMUNE_RPC_URL;

module.exports = {
  solidity: "0.8.20",
  networks: {
    commune: {
      url: COMMUNE_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 9461,
      gasPrice: 1000000000,  // 1 gwei
    },
    hardhat: {
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
```

## Smart Contract Development

### Sample ERC-20 Token Contract

Create `contracts/MyToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

### Test Script

Create `test/MyToken.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let myToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy(
      "MyToken",
      "MTK",
      ethers.parseEther("1000000") // 1 million tokens
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await myToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await myToken.balanceOf(owner.address);
      expect(await myToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await myToken.transfer(addr1.address, 50);
      expect(await myToken.balanceOf(addr1.address)).to.equal(50);

      await myToken.connect(addr1).transfer(addr2.address, 50);
      expect(await myToken.balanceOf(addr2.address)).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await myToken.balanceOf(owner.address);
      await expect(
        myToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      expect(await myToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });
});
```

### Deployment Script

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy(
    "MyToken",
    "MTK",
    ethers.parseEther("1000000") // 1 million tokens
  );

  await myToken.waitForDeployment();
  const address = await myToken.getAddress();

  console.log("Token deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Development Workflow

1. **Compile Contracts**
```bash
npx hardhat compile
```

2. **Run Tests**
```bash
npx hardhat test
```

3. **Run Local Node (Optional)**
```bash
npx hardhat node
```

4. **Deploy to Commune Testnet**
```bash
npx hardhat run scripts/deploy.js --network commune
```

## Contract Verification

Create `scripts/verify.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  
  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [
      "MyToken",
      "MTK",
      ethers.parseEther("1000000")
    ],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

To verify:
```bash
npx hardhat run scripts/verify.js --network commune
```

## Interacting with Deployed Contracts

Create `scripts/interact.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = MyToken.attach(contractAddress);

  // Get total supply
  const totalSupply = await myToken.totalSupply();
  console.log("Total Supply:", ethers.formatEther(totalSupply));

  // Get balance
  const [signer] = await ethers.getSigners();
  const balance = await myToken.balanceOf(signer.address);
  console.log("Balance:", ethers.formatEther(balance));

  // Transfer tokens
  const transferAmount = ethers.parseEther("100");
  const tx = await myToken.transfer("RECIPIENT_ADDRESS", transferAmount);
  await tx.wait();
  console.log("Transfer successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```



## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)