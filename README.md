# Project Running Guide

## Overview

Pineapple app uses chatgpt endpoint. Call limits per day is calculated the holding amount of Pineapple(PA) token

## Prerequisites

### Required Global Installations

```bash
npm install -g npm@latest
npm install -g yarn
npm install -g hardhat
```

### Project token deploy

1. Go to pineapple-token-deploy folder:

```bash
cd pineapple-token-deploy
```

2. Install required dependencies:

```bash
npm install
```

3. Initialize Hardhat config:
   Go to hardhat.config.js.
   Replace your private key of erc-20 wallet address in the accounts section.
   Make sure you have COMAI testnet tokens in your wallet.
   You can read the first section on transferring tokens from your substrate wallet to your erc-20 address here:
   https://communeai.org/docs/subspace/evm .

4. Deploying token

```bash
npx hardhat run scripts/deployPineapple.js --network comai_testnet
```

You can change token's metadata at scripts/deployPineapple.js

```plaintext
const dex = await hre.ethers.deployContract("StandardToken", ['Your_token_name', "token_symbol", 18, 1000000000000000000000000000n]);
```

Go to https://communeai.tryethernal.com/ to check token address that deployed.
Save that address for future usage.

### Environment Setup

1. Install mongodb in your laptop.
   Follow guide here: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/

2. Change a `.env.example` to `.env` file in your project root:
   Get a chatgpt api key. Please make sure you deposit some fund to use api key.
   If you set password for mongodb then use this as MONGODB_URI='mongodb://myUser:myPassword@127.0.0.1:27017'; // Replace with your credentials

```plaintext
MONGODB_URI="mongodb://127.0.0.1:27017"
CHATGPT_API_KEY=Your_chatgpt_api_key_here
NEXT_PUBLIC_SEVER_URI="http://127.0.0.1:8000"
NEXT_PUBLIC_AMOUNT_PER_CALL=10
```

## Project Configuration

### Token address setting

Go to src/constant/contract.js
Replace tokenAddr with what you deployed token address.

```javascript
export const contract = {
  9461: {
    tokenAddr: 'Your_token_address_here',
  },
};
```

## Backend(Fastapi) Running

### Python code of function calling Chat GPT endpiont

```javascript
async def get_gpt_response(query: str) -> str:
    async with aiohttp.ClientSession() as session:
        headers = {
            'Authorization': f'Bearer {gpt_api_key}',
            'Content-Type': 'application/json',
        }
        payload = {
            'model': 'gpt-4',  # or 'gpt-3.5-turbo' if you have access
            'messages': [{'role': 'user', 'content': query}],
            'max_tokens': 100,  # Adjust as needed
        }
        async with session.post(endpoint, json=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                message = ''.join(choice['message']['content'] for choice in data['choices'])
                return message
            else:
                print(f"Error fetching GPT response: {response.status}")
                raise HTTPException(status_code=response.status, detail="Error fetching GPT response")
```
### Run Fastapi backend

Go to fastapi-backend folder

```bash
python -m venv venv
venv\Scripts\activate
pip install fastapi motor aiohttp uvicorn python-dotenv
uvicorn main:app --reload
```

## Frontend Running

### Install dependencies

```bash
yarn
```

### Running on developer mode

```bash
yarn run dev
```

### Running on product mode

```bash
yarn run build
yarn start
```

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Commune EVM Documentation](https://communeai.org/docs/subspace/evm)
- [Fastapi Documentation](https://fastapi.tiangolo.com)