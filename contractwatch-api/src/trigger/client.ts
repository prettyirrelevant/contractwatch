import { intervalTrigger, TriggerClient, eventTrigger } from '@trigger.dev/sdk';
import { createPublicClient, http } from 'viem';
import { z } from 'zod';

import { scrollSepoliaAnkr } from '../helpers';
import { initDbClient, schema } from '../db';

export const createTriggerClient = (opts: {
  tursoAuthToken: string;
  tursoUrl: string;
  apiKey: string;
  apiUrl: string;
}) => {
  const { tursoAuthToken, tursoUrl, apiKey, apiUrl } = opts;

  const triggerClient = new TriggerClient({
    id: 'contractwatch',
    apiUrl: apiUrl,
    apiKey: apiKey,
  });

  const blockChunkSize = 3000;
  const { db } = initDbClient(tursoUrl, tursoAuthToken);

  const publicClient = createPublicClient({
    chain: scrollSepoliaAnkr,
    transport: http(),
  });

  // todo(@prettyirrelevant): find a way to group jobs into modules without losing type inference.

  triggerClient.defineJob({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    run: async (_payload, io, _ctx) => {
      const contracts = await io.runTask(
        'get all contracts',
        async () =>
          await db
            .select({
              lastQueriedBlock: schema.contracts.lastQueriedBlock,
              creationBlock: schema.contracts.creationBlock,
              address: schema.contracts.address,
            })
            .from(schema.contracts),
      );

      const latestBlock = await io.runTask('get latest block', async () =>
        Number(await publicClient.getBlockNumber()),
      );

      contracts.forEach(async (contract) => {
        const events = [];
        const fromBlock = contract.lastQueriedBlock === -1 ? contract.creationBlock : contract.lastQueriedBlock;

        for (let start = fromBlock; start <= latestBlock; start += blockChunkSize) {
          const end = Math.min(start + blockChunkSize - 1, latestBlock);
          events.push({
            payload: { address: contract.address, fromBlock: start, toBlock: end },
            name: 'index.contract',
          });
        }

        await io.sendEvents(`index ${contract.address} ${fromBlock}:${latestBlock}`, events);
        // await io.runTask(
        //   `update lastQueriedBlock for ${contract.address}`,
        //   async () =>
        //     await db
        //       .update(schema.contracts)
        //       .set({ lastQueriedBlock: latestBlock })
        //       .where(eq(schema.contracts.address, contract.address))
        //       .returning({ updatedContractAddress: schema.contracts.address }),
        // );
      });
    },
    trigger: intervalTrigger({ seconds: 300 }),
    name: 'Contract Indexer Scheduler',
    id: 'contract-indexer-scheduler',
    version: '0.0.1',
  });

  triggerClient.defineJob({
    trigger: eventTrigger({
      schema: z.object({
        fromBlock: z.coerce.bigint(),
        toBlock: z.coerce.bigint(),
        address: z.string(),
      }),
      name: 'index.contract',
    }),

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    run: async (payload, io, _ctx) => {
      const { fromBlock, address, toBlock } = payload;
      io.logger.debug(`${fromBlock}:${toBlock} - ${address}`);
    },
    id: 'contract-indexer-job',
    name: 'Contract Indexer',
    version: '0.0.1',
  });

  return triggerClient;
};
