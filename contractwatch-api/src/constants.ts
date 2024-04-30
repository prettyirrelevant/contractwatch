export const subscriptionAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        type: 'address',
        name: '_token',
      },
      {
        internalType: 'uint256',
        name: '_pricePerCredit',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
        indexed: true,
      },
      {
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
        name: 'amount',
      },
    ],
    name: 'CreditsConsumed',
    anonymous: false,
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
        indexed: true,
      },
      {
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
        name: 'amount',
      },
      {
        internalType: 'uint256',
        name: 'pricePerCredit',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'CreditsPurchased',
    anonymous: false,
    type: 'event',
  },
  {
    outputs: [
      {
        internalType: 'address',
        type: 'address',
        name: '',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'admin',
    inputs: [],
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'subscriber',
        type: 'address',
      },
      {
        internalType: 'uint256',
        type: 'uint256',
        name: 'amount',
      },
    ],
    stateMutability: 'nonpayable',
    name: 'deductCredits',
    type: 'function',
    outputs: [],
  },
  {
    outputs: [
      {
        internalType: 'uint256',
        type: 'uint256',
        name: '',
      },
    ],
    stateMutability: 'view',
    name: 'pricePerCredit',
    type: 'function',
    inputs: [],
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    name: 'purchaseCredits',
    type: 'function',
    outputs: [],
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newPrice',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    name: 'setPricePerCredit',
    type: 'function',
    outputs: [],
  },
  {
    outputs: [
      {
        internalType: 'uint256',
        type: 'uint256',
        name: '',
      },
    ],
    inputs: [
      {
        internalType: 'address',
        type: 'address',
        name: '',
      },
    ],
    name: 'subscriptionCredits',
    stateMutability: 'view',
    type: 'function',
  },
  {
    outputs: [
      {
        internalType: 'contract IERC20',
        type: 'address',
        name: '',
      },
    ],
    stateMutability: 'view',
    name: 'watchToken',
    type: 'function',
    inputs: [],
  },
  {
    inputs: [
      {
        internalType: 'address',
        type: 'address',
        name: '_to',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    name: 'withdrawTokens',
    type: 'function',
    outputs: [],
  },
] as const;
