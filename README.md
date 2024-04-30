# 📜 ContractWatch

ContractWatch is a powerful tool that simplifies monitoring and tracking events emitted by Ethereum smart contracts. 🔍 With ContractWatch, you can effortlessly retrieve contract events, apply filters based on various criteria, and seamlessly integrate them into your applications. 🚀

> [!NOTE]
> 📌 Currently, only Scroll Sepolia is supported.

## 🌟 Features

- 🏗️ Manage applications associated with specific smart contracts
- 🔍 Filter events by block range, event name, transaction hash, and more.
- 📏 Pagination support for efficient event retrieval
- 🔒 Secure authentication using wallet signatures
- 🔑 API key management for secure access to event data
- 💰 ERC20 token for API usage and credit management
- 🛒 Subscription contract for purchasing ERC20 tokens and API credits

## 💰 ERC20 Token and Subscription Contract

ContractWatch utilizes an ERC20 token and a subscription contract to manage API access and usage. The ERC20 token serves as a means of payment for accessing the ContractWatch API, while the subscription contract allows users to purchase the ERC20 token and buy API credits.

To gain access to the ContractWatch API, users need to:

1. 🛒 Interact with the subscription contract to purchase the ERC20 token.
2. 💸 Use the ERC20 token to buy API credits through the subscription contract.
3. 🔑 Utilize the purchased API credits to make requests to the ContractWatch API endpoints.

The subscription contract provides a seamless and secure way for users to acquire the necessary ERC20 tokens and API credits.

### 🔗 Deployed Contracts
Below are the links to the deployed ERC20 token and subscription contract:

- Watch Token (CWT): [0xd62bfbf2050e8fead90e32558329d43a6efce4c8](https://sepolia.scrollscan.com/address/0xd62bfbf2050e8fead90e32558329d43a6efce4c8)
- Subscription Contract: [0xfca69b9033c414cbcfa24b30228376fd040b70b2](https://sepolia.scrollscan.com/address/0xfca69b9033c414cbcfa24b30228376fd040b70b2)

Please refer to these contracts for purchasing ERC20 tokens and API credits.

## 🚀 Getting Started

To get started with ContractWatch, follow these steps:

1. 💳 Interact with the subscription contract to purchase ERC20 tokens and API credits.
2. 🔐 Authenticate your requests by including the required wallet signature in the header.
3. 🏗️ Create an application by providing the contract address and other relevant details.
4. 📥 Retrieve contract events using the provided API endpoints and filters.
5. 🔧 Integrate the retrieved event data into your application.

For detailed information on interacting with the subscription contract and using the API endpoints, please refer to the API documentation. 📚

## 🌐 API Endpoints

- `POST /api/applications`: Create a new application associated with a smart contract.
- `GET /api/applications`: Retrieve a list of your applications.
- `GET /api/applications/:id`: Retrieve details of a specific application.
- `DELETE /api/applications/:id`: Delete an application.
- `GET /api/accounts/api-keys`: Retrieve a list of your API keys.
- `POST /api/accounts/api-keys`: Create a new API key.
- `DELETE /api/accounts/api-keys/:id`: Delete an API key.
- `GET /api/events`: Retrieve contract events based on specified filters.

## 🔒 Authentication

ContractWatch provides two authentication methods:

1. 🔏 Wallet Signature: Sign a predefined message using your Ethereum wallet and include the signature in the `X-Wallet-Signature` header.
2. 🔑 API Key: Include your API key in the `X-API-Key` header when making requests to the `/api/events` endpoint.

Ensure that you keep your wallet and API keys secure. 🙊

### 🔏 Generating Wallet Signatures

To generate a wallet signature for authentication, follow these steps:

1. 📝 Use the following predefined message to sign:
   ```
   'By signing this message, I confirm my intention to use ContractWatch and agree to the associated terms and conditions.'
   ```
2. 🔑 Use your Ethereum wallet (e.g., MetaMask) to sign the predefined message.
3. 📋 Copy the generated signature.
4. 📥 Include the signature in the `X-Wallet-Signature` header when making requests to the ContractWatch API.

Here's a code snippet to generate the wallet signature in TypeScript using the `ethers` library:

```typescript
import { ethers } from 'ethers';

const message = 'By signing this message, I confirm my intention to use ContractWatch and agree to the associated terms and conditions.';
const signer = new ethers.Wallet(privateKey);
const signature = await signer.signMessage(message);
```

And here's a code snippet to generate the wallet signature in Python using the `web3` library:

```python
from web3.auto import w3

message = 'By signing this message, I confirm my intention to use ContractWatch and agree to the associated terms and conditions.'
signed_message = w3.eth.account.sign_message(message, private_key=private_key)
signature = signed_message.signature.hex()
```

## 🆘 Support

If you encounter any issues or have questions about ContractWatch, please open an issue here on GitHub. 🐛

Happy contract watching! 🎉
