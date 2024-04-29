import { verifyMessage, getAddress, isAddress } from 'viem';
import { HTTPException } from 'hono/http-exception';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { addMiddleware } from '@trigger.dev/hono';
import { zValidator } from '@hono/zod-validator';
import { poweredBy } from 'hono/powered-by';
import { and, eq } from 'drizzle-orm';
import { logger } from 'hono/logger';
import { cache } from 'hono/cache';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { z } from 'zod';

import { getOrCreateContract, getOrCreateAccount, initDbClient, schema, newId } from './db';
import { getContractCreationBlock } from './helpers';
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
  if (c.req.path === '/api/trigger' || c.req.path === '/api/events') {
    await next();
    return;
  }

  const headerSignature = c.req.header('X-Wallet-Signature');
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

app.use('/api/events', async (c, next) => {
  if (c.req.method === 'GET') {
    const apiKey = c.req.header('X-API-Key');
    if (!apiKey) {
      throw new HTTPException(401, { message: 'Missing API key. Include a valid API key in the "X-API-Key" header.' });
    }

    const { db } = c.get('services');
    const apiKeys = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.key, apiKey)).limit(1);
    if (apiKeys.length === 0) {
      throw new HTTPException(401, {
        message: 'Invalid or inactive API key. Please provide a valid and active API key.',
      });
    }

    if (!apiKeys[0].isActive) {
      throw new HTTPException(401, {
        message: 'Invalid or inactive API key. Please provide a valid and active API key.',
      });
    }
  }

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
      startBlock: z.number().optional(),
      name: z.string().max(100),
    }),
  ),
  async (c) => {
    const data = c.req.valid('json');

    const { db } = c.get('services');
    const { id: userId } = c.get('auth');

    const { initBlockNumber, creationTxHash } = await getContractCreationBlock(data.address);
    await getOrCreateContract(db, data.address, { creationBlock: initBlockNumber, creationTxHash });

    const appId = newId('application');
    await db.insert(schema.applications).values({
      startBlock: data.startBlock || initBlockNumber,
      contractAddress: data.address,
      accountId: userId as string,
      name: data.name,
      id: appId,
    });

    return c.json({ message: 'Application created successfully', data: { id: appId } }, 201);
  },
);

app.get('/api/applications', async (c) => {
  const { db } = c.get('services');
  const { id } = c.get('auth');

  const apps = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.accountId, id as string));

  return c.json({ message: 'Applications returned successfully', data: apps });
});

app.get('/api/applications/:id', zValidator('param', z.object({ id: z.string().startsWith('apps') })), async (c) => {
  const { id } = c.req.valid('param');
  const { db } = c.get('services');
  const { id: accountId } = c.get('auth');

  const apps = await db
    .select()
    .from(schema.applications)
    .where(and(eq(schema.applications.accountId, accountId as string), eq(schema.applications.id, id)))
    .limit(1);

  if (apps.length === 0) {
    throw new HTTPException(404, { message: `Application with id: ${id} does not exist` });
  }

  return c.json({ message: 'Application returned successfully', data: app });
});

app.delete(
  '/api/applications/:id',
  zValidator('param', z.object({ id: z.string().startsWith('apps') })),
  async (c) => {
    const { id } = c.req.valid('param');
    const { db } = c.get('services');
    const { id: accountId } = c.get('auth');

    await db
      .delete(schema.applications)
      .where(and(eq(schema.applications.accountId, accountId as string), eq(schema.applications.id, id)));

    return c.json({ message: 'Application with id: ${id} deleted successfully', data: null });
  },
);

app.get('/api/accounts/api-keys', async (c) => {
  const { db } = c.get('services');
  const { id } = c.get('auth');

  const apiKeys = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.accountId, id as string));

  return c.json({ message: 'API keys returned successfully', data: apiKeys });
});

app.post('/api/accounts/api-keys', async (c) => {
  const { db } = c.get('services');
  const { id: accountId } = c.get('auth');

  const apiKey = await db
    .insert(schema.apiKeys)
    .values({ accountId: accountId as string, id: newId('apiKey') })
    .returning();

  return c.json({ message: 'API key created successfully', data: apiKey }, 201);
});

app.delete(
  '/api/accounts/api-keys/:id',
  zValidator('param', z.object({ id: z.string().startsWith('api_key') })),
  async (c) => {
    const { id: accountId } = c.get('auth');
    const { db } = c.get('services');
    const { id } = c.req.valid('param');

    await db
      .delete(schema.apiKeys)
      .where(and(eq(schema.apiKeys.accountId, accountId as string), eq(schema.apiKeys.id, id)));

    return c.json({ message: 'API key deleted successfully', data: null });
  },
);

// app.get('/api/events', (c) => {
//   const { db } = c.get('services');
//   const { id } = c.get('auth');

//   return c.json('');
// });

app.onError((err, c) => {
  console.error(err.stack);

  const status = err instanceof HTTPException ? err.status : 500;
  return c.json({ error: { message: err.message, name: err.name } }, status);
});

app.notFound((c) => {
  return c.json({ error: { message: `${c.req.path} not found.`, name: 'NOT_FOUND' } }, 404);
});

export default app;
