import { verifyMessage, getAddress, isAddress } from 'viem';
import { HTTPException } from 'hono/http-exception';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { addMiddleware } from '@trigger.dev/hono';
import { zValidator } from '@hono/zod-validator';
import { poweredBy } from 'hono/powered-by';
import { and, eq } from 'drizzle-orm';
import { logger } from 'hono/logger';
import { cache } from 'hono/cache';
import { Abi } from 'abitype/zod';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { z } from 'zod';

import { getContractCreationBlock, fetchAbiFromEtherscan } from './helpers';
import { getOrCreateAccount, initDbClient, schema, newId } from './db';
import { createTriggerClient } from './trigger';

const app = new Hono<{
  Bindings: {
    TURSO_AUTH_TOKEN: string;
    TRIGGER_API_KEY: string;
    TRIGGER_API_URL: string;
    TURSO_URL: string;
  };
  Variables: {
    auth: { address?: `0x${string}`; id?: string };
    services: { db: LibSQLDatabase };
  };
}>();

app.use(poweredBy());
app.use(logger());
app.use(cors());

app.use(async (c, next) => {
  const { db } = initDbClient(c.env.TURSO_URL, c.env.TURSO_AUTH_TOKEN);

  c.set('services', { db });
  await next();
});

addMiddleware(app, (env) =>
  createTriggerClient({
    tursoAuthToken: env.TURSO_AUTH_TOKEN,
    apiKey: env.TRIGGER_API_KEY,
    apiUrl: env.TRIGGER_API_URL,
    tursoUrl: env.TURSO_URL,
  }),
);

app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/trigger' || c.req.path === '/api/banks') {
    await next();
    return;
  }

  const headerSignature = c.req.header('X-Signature');
  if (!headerSignature) {
    throw new HTTPException(401, { message: 'Authentication header missing!' });
  }

  const [address, signature] = headerSignature.split(':');
  if (!isAddress(address)) {
    throw new HTTPException(401, { message: 'Invalid address provided in signature. Make sure it is checksum' });
  }

  const isValid = await verifyMessage({
    message:
      'By signing this message, I confirm my intention to use ContractWatch and agree to the associated terms and conditions.',
    signature: signature as `0x${string}`,
    address,
  });
  if (!isValid) {
    throw new HTTPException(401, { message: 'Invalid signature provided' });
  }

  const { db } = c.get('services');
  const accountId = newId('account');

  const account = await getOrCreateAccount(db, accountId, address);
  c.set('auth', { id: account ? account.id : accountId, address });

  await next();
});

app.get(
  '*',
  cache({
    cacheControl: 'max-age=3600',
    cacheName: 'contractwatch',
  }),
);

app.get('/', (c) => {
  return c.json({ data: { msg: 'pong!' } });
});

app.post(
  '/api/applications',
  zValidator(
    'json',
    z.object({
      address: z
        .string()
        .length(42)
        .refine((val) => isAddress(val), { message: 'Invalid contract address provided' })
        .transform((val) => getAddress(val)),
      events: z.array(z.string()).min(1).max(10),
      startBlock: z.number().optional(),
      abi: z.string().optional(),
      name: z.string().max(100),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json');
    let abi = data.abi;
    if (!abi) {
      abi = await fetchAbiFromEtherscan(data.address);
    }

    const parsedAbi = Abi.parse(abi);
    for (const event of data.events) {
      if (!parsedAbi.some((parsedEvent) => parsedEvent.type === 'event' && parsedEvent.name === event)) {
        throw new HTTPException(422, { message: `One of the events, ${event} provided is not present in the ABI` });
      }
    }

    let startBlock = data.startBlock;
    if (!startBlock) {
      const { blockNumber } = await getContractCreationBlock(data.address);
      startBlock = blockNumber;
    }

    const { db } = c.get('services');
    const { id: userId } = c.get('auth');

    const appId = newId('application');
    await db.insert(schema.applications).values({
      blockQueryState: { lastQueriedBlock: -1, startBlock },
      contractAddress: data.address,
      accountId: userId as string,
      indexedEvents: data.events,
      name: data.name,
      abi: parsedAbi,
      id: appId,
    });

    return c.json({ message: 'Application created successfully', data: { id: appId } }, 201);
  },
);

app.get('api/applications', async (c) => {
  const { db } = c.get('services');
  const { id } = c.get('auth');

  const apps = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.accountId, id as string));

  return c.json({ message: 'Applications returned successfully', data: apps });
});

app.get('api/applications/:appId', zValidator('param', z.object({ appId: z.string() })), async (c) => {
  const { appId } = c.req.valid('param');
  const { db } = c.get('services');
  const { id } = c.get('auth');

  const apps = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.accountId, id as string), eq(schema.applications.id, appId)))
    .limit(1);

  if (apps.length === 0) {
    throw new HTTPException(404, { message: `Application with id: ${appId} does not exist` });
  }

  return c.json({ message: 'Applications returned successfully', data: app });
});

app.delete('api/applications/:appId', zValidator('param', z.object({ appId: z.string() })), async (c) => {
  const { appId } = c.req.valid('param');
  const { db } = c.get('services');
  const { id } = c.get('auth');

  await db
    .delete(schema.applications)
    .where(and(eq(schema.applications.accountId, id as string), eq(schema.applications.id, appId)));

  return c.json({ message: 'Application with id: ${appId} deleted successfully', data: null });
});

// endpoint to add a contract and events to be monitored.
// endpoint to fetch the events from the REST API.
// endpoint to remove contract(s).

app.onError((err, c) => {
  console.error(err.stack);

  const status = err instanceof HTTPException ? err.status : 500;
  return c.json({ error: { message: err.message, name: err.name } }, status);
});

app.notFound((c) => {
  return c.json({ error: { message: `${c.req.path} not found.`, name: 'NOT_FOUND' } }, 404);
});

export default app;
