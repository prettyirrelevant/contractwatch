import { Abi } from 'abitype/zod';

interface ABIEtherscanResponse {
  status: '1' | '0';
  message: string;
  result: string;
}

interface ContractCreationEtherscanResponse {
  result: {
    contractCreator: string;
    contractAddress: string;
    txHash: string;
  }[];
  status: '1' | '0';
  message: string;
}

interface GetTransactionEtherscanResponse {
  error?: {
    message: string;
    code: number;
  };
  result?: {
    blockNumber: string;
  };
  jsonrpc: string;
  id: number;
}

const buildEtherscanUrl = (params: Record<string, string>) => {
  const url = new URL('https://api-sepolia.scrollscan.dev/api');
  url.search = new URLSearchParams({
    ...params,
    apiKey: 'PEUVZ97A5RQX3K6C56EKN5VKSQYMFGFBKI',
  }).toString();
  return url.toString();
};

export const fetchAbiFromEtherscan = async (contractAddress: string) => {
  const params = {
    address: contractAddress,
    module: 'contract',
    action: 'getabi',
  };

  try {
    const response = await fetch(buildEtherscanUrl(params));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const abiResponse = (await response.json()) as ABIEtherscanResponse;
    if (abiResponse.status !== '1') {
      throw new Error(`ABI not found. Message: ${abiResponse.message}`);
    }

    return Abi.parse(abiResponse.result);
  } catch (error) {
    console.error('Failed to fetch ABI from Etherscan:', error);
    throw error;
  }
};

export const getContractCreationBlock = async (contractAddress: string) => {
  const contractCreationParams = {
    contractaddresses: contractAddress,
    action: 'getcontractcreation',
    module: 'contract',
  };

  try {
    const contractCreationResponse = await fetch(buildEtherscanUrl(contractCreationParams));
    if (!contractCreationResponse.ok) {
      throw new Error(`HTTP error! status: ${contractCreationResponse.status}`);
    }

    const contractCreationData = (await contractCreationResponse.json()) as ContractCreationEtherscanResponse;
    if (contractCreationData.status !== '1') {
      throw new Error(`Contract creation tx hash not found. Message: ${contractCreationData.message}`);
    }

    const creationTxHash = contractCreationData.result[0].txHash;

    const transactionParams = {
      action: 'eth_getTransactionByHash',
      txhash: creationTxHash,
      module: 'proxy',
    };

    const transactionResponse = await fetch(buildEtherscanUrl(transactionParams));
    if (!transactionResponse.ok) {
      throw new Error(`HTTP error! status: ${transactionResponse.status}`);
    }

    const transactionData = (await transactionResponse.json()) as GetTransactionEtherscanResponse;
    if (transactionData.error) {
      throw new Error(`Error retrieving transaction hash. Message: ${JSON.stringify(transactionData.error)}`);
    }

    const initBlockNumber = parseInt(transactionData.result?.blockNumber as string);
    return { initBlockNumber, creationTxHash };
  } catch (error) {
    console.error('Failed to retrieve contract creation block from Etherscan:', error);
    throw error;
  }
};

// Run a task for each contract.
// 1. get all distinct appplications(contract address, abi)
//
