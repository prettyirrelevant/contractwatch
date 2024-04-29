import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { customAlphabet } from 'nanoid';
import { eq } from 'drizzle-orm';

import { accounts } from './schema';

const prefixes = {
  application: 'apps',
  account: 'accounts',
  apiKey: 'api_key',
  cache: 'cache',
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
