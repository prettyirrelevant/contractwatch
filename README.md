# ContractWatch

ContractWatch is a project that allows you to monitor and track events emitted by Ethereum smart contracts. With it, you can easily retrieve contract events, filter them based on various criteria, and integrate them into your applications.

> [!NOTE]
> Only Scroll Sepolia is supported at this time.

## Features

- Create and manage applications associated with specific smart contracts
- Retrieve contract events with customizable filters
- Filter events by block range, event name, transaction hash, and more
- Pagination support for efficient event retrieval
- Secure authentication using wallet signatures
- API key management for secure access to event data
- ERC20 token for API usage and credit management
- Subscription contract for purchasing ERC20 tokens and API credits

## ERC20 Token and Subscription Contract

ContractWatch utilizes an ERC20 token and a subscription contract to manage API access and usage. The ERC20 token serves as a means of payment for accessing the ContractWatch API, while the subscription contract allows users to purchase the ERC20 token and buy API credits.

To gain access to the ContractWatch API, users need to:
1. Interact with the subscription contract to purchase the ERC20 token.
2. Use the ERC20 token to buy API credits through the subscription contract.
3. Utilize the purchased API credits to make requests to the ContractWatch API endpoints.

The subscription contract provides a seamless and secure way for users to acquire the necessary ERC20 tokens and API credits.

## Getting Started

To get started with ContractWatch, follow these steps:

1. Sign up for a ContractWatch account and obtain your API credentials.
2. Interact with the subscription contract to purchase ERC20 tokens and API credits.
3. Authenticate your requests by including the required headers (wallet signature or API key).
4. Create an application by providing the contract address and other relevant details.
5. Retrieve contract events using the provided API endpoints and filters.
6. Integrate the retrieved event data into your application.

For detailed information on interacting with the subscription contract and using the API endpoints, please refer to the API documentation.

## API Endpoints

- `POST /api/applications`: Create a new application associated with a smart contract.
- `GET /api/applications`: Retrieve a list of your applications.
- `GET /api/applications/:id`: Retrieve details of a specific application.
- `DELETE /api/applications/:id`: Delete an application.
- `GET /api/accounts/api-keys`: Retrieve a list of your API keys.
- `POST /api/accounts/api-keys`: Create a new API key.
- `DELETE /api/accounts/api-keys/:id`: Delete an API key.
- `GET /api/events`: Retrieve contract events based on specified filters.

## Authentication

ContractWatch provides two authentication methods:

1. Wallet Signature: Sign a predefined message using your Ethereum wallet and include the signature in the `X-Wallet-Signature` header.
2. API Key: Include your API key in the `X-API-Key` header when making requests to the `/api/events` endpoint.

Ensure that you keep your API keys secure and do not share them with unauthorized parties.

## Support

If you encounter any issues or have questions about ContractWatch, please open an issue here on GitHub.

Happy contract watching!
