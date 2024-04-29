import { migrate } from 'drizzle-orm/libsql/migrator';
import * as dotenv from 'dotenv';
import path from 'node:path';

import { initDbClient } from './client';

dotenv.config({ path: path.dirname(path.dirname(__dirname)) + '/.dev.vars' });

const { client, db } = initDbClient(process.env.TURSO_URL as string, process.env.TURSO_AUTH_TOKEN as string);

async function main() {
  await migrate(db, {
    migrationsFolder: 'src/db/migrations',
  });
}

main()
  .then(() => {
    console.log('Tables migrated!');
    client.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error performing migration: ', err);
    client.close();
    process.exit(1);
  });
