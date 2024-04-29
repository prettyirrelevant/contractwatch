import { TriggerClient } from '@trigger.dev/sdk';
import { createPublicClient, http } from 'viem';
import { scrollSepolia } from 'viem/chains';

import { initDbClient } from '../db';

export const createTriggerClient = (opts: {
  tursoAuthToken: string;
  tursoUrl: string;
  apiKey: string;
  apiUrl: string;
}) => {
  const { tursoAuthToken, tursoUrl, apiKey, apiUrl } = opts;

  const client = new TriggerClient({
    id: 'wrapped-naira',
    apiUrl: apiUrl,
    apiKey: apiKey,
  });

  const db = initDbClient(tursoUrl, tursoAuthToken);

  const publicClient = createPublicClient({
    chain: scrollSepolia,
    transport: http(),
  });

  // todo(@prettyirrelevant): find a way to group jobs into modules without losing type inference.

  return client;
};
