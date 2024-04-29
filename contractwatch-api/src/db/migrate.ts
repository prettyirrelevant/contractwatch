import { migrate } from 'drizzle-orm/libsql/migrator';
import 'dotenv/config';

import { initDbClient } from './client';

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
