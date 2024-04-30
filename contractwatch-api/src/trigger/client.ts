import { intervalTrigger, TriggerClient, eventTrigger } from '@trigger.dev/sdk';
import { createPublicClient, decodeEventLog, http, Log } from 'viem';
import { InferInsertModel, eq } from 'drizzle-orm';
import { Abi } from 'abitype/zod';
import { z } from 'zod';

import { stringifyJsonWithBigInt, parseJsonWithBigInt, scrollSepoliaAnkr } from '../helpers';
import { initDbClient, schema, newId } from '../db';

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

      for (const contract of contracts) {
        await io.runTask(`chunk log indexing for ${contract.address}`, async () => {
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
          await io.runTask(
            `update lastQueriedBlock for ${contract.address}`,
            async () =>
              await db
                .update(schema.contracts)
                .set({ lastQueriedBlock: latestBlock })
                .where(eq(schema.contracts.address, contract.address))
                .returning({ updatedContractAddress: schema.contracts.address }),
          );
        });
      }
    },
    trigger: intervalTrigger({ seconds: 90 }),
    name: 'Contract Indexer Scheduler',
    id: 'contract-indexer-scheduler',
    version: '0.0.3',
  });

  triggerClient.defineJob({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    run: async (payload, io, _ctx) => {
      const { fromBlock, address, toBlock } = payload;
      const contract = await io.runTask(
        `fetch contract ${address} from db for block range ${fromBlock}:${toBlock}`,
        async () => {
          const result = await db
            .select()
            .from(schema.contracts)
            .where(eq(schema.contracts.address, address as `0x${string}`))
            .limit(1);

          return { ...result[0], abi: JSON.stringify(result[0].abi) };
        },
      );

      const abi = Abi.parse(JSON.parse(contract.abi));
      const events = await io.runTask(`get events for ${contract.address} ${fromBlock}:${toBlock}`, async () => {
        const logs = await publicClient.getContractEvents({
          fromBlock: BigInt(fromBlock),
          address: contract.address,
          toBlock: BigInt(toBlock),
          abi,
        });

        return logs.map((log) => stringifyJsonWithBigInt(log));
      });

      if (events.length < 1) return;

      const updatedEvents: InferInsertModel<typeof schema.events>[] = events.map((eventStr) => {
        const event = parseJsonWithBigInt(eventStr) as Log;
        const decodedEvent = decodeEventLog({ topics: event.topics, data: event.data, abi });
        return {
          blockNumber: Number(event.blockNumber),
          txIndex: event.transactionIndex,
          txHash: event.transactionHash,
          name: decodedEvent.eventName,
          blockHash: event.blockHash,
          address: contract.address,
          logIndex: event.logIndex,
          args: decodedEvent.args,
          topics: event.topics,
          id: newId('events'),
          data: event.data,
        };
      });

      await io.runTask(`insert events for ${contract.address} ${fromBlock}:${toBlock} into db`, async () => {
        await db.insert(schema.events).values(updatedEvents);
        return;
      });

      io.logger.debug(`${fromBlock}:${toBlock} - ${address}`);
    },

    trigger: eventTrigger({
      schema: z.object({
        fromBlock: z.number(),
        toBlock: z.number(),
        address: z.string(),
      }),
      name: 'index.contract',
    }),
    id: 'contract-indexer-job',
    name: 'Contract Indexer',
    version: '0.0.2',
  });

  return triggerClient;
};
