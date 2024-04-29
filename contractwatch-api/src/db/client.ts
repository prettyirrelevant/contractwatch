import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

export const initDbClient = (url: string, authToken: string) => {
  const client = createClient({ authToken, url });
  const db = drizzle(client);

  return { client, db };
};
