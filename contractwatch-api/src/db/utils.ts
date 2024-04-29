import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { customAlphabet } from 'nanoid';
import { eq } from 'drizzle-orm';

import { fetchAbiFromEtherscan } from '../helpers';
import { contracts, accounts } from './schema';

const prefixes = {
  contracts: 'contracts',
  application: 'apps',
  account: 'accounts',
  apiKey: 'api_key',
} as const;

const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');

export const newId = (prefix: keyof typeof prefixes): string => {
  return [prefixes[prefix], nanoid(16)].join('_');
};

export const generateApiKey = (): string => {
  return nanoid(32);
};

export const getOrCreateAccount = async (db: LibSQLDatabase, id: string, address: `0x${string}`) => {
  const result = await db.select().from(accounts).where(eq(accounts.address, address)).limit(1);
  if (result.length == 0) {
    return (
      await db
        .insert(accounts)
        .values({ id: newId('account'), address: address })
        .returning()
    )[0];
  }

  return result[0];
};

export const getOrCreateContract = async (
  db: LibSQLDatabase,
  address: `0x${string}`,
  opts: { creationTxHash: string; creationBlock: number },
) => {
  const result = await db.select().from(contracts).where(eq(contracts.address, address)).limit(1);
  if (result.length == 0) {
    const abi = await fetchAbiFromEtherscan(address);
    return (
      await db
        .insert(contracts)
        .values({ id: newId('contracts'), address: address, abi, ...opts })
        .returning()
    )[0];
  }

  return result[0];
};
