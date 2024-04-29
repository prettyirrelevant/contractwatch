import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

import { generateApiKey } from './utils';

export const accounts = sqliteTable('accounts', {
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  address: text('address', { length: 42 }).$type<`0x${string}`>().notNull().unique(),
  id: text('id').primaryKey(),
});

export const applications = sqliteTable('applications', {
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  blockQueryState: text('block_query_state', { mode: 'json' })
    .notNull()
    .$type<{ lastQueriedBlock: number; startBlock: number }>(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  contractAddress: text('contract_address', { length: 42 }).$type<`0x${string}`>().notNull(),
  indexedEvents: text('indexed_events', { mode: 'json' }).notNull().$type<string[]>(),
  name: text('name', { length: 100 }).notNull(),
  abi: text('abi', { mode: 'json' }).notNull(),
  id: text('id').primaryKey(),
});

// todo: improve this. allow blocks to be filtered, allow args to be filtered also.
export const events = sqliteTable('events', {
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  applicationId: text('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  decodedLogs: text('decoded_logs', { mode: 'json' }).notNull(),
  logs: text('logs', { mode: 'json' }).notNull(),
  id: text('id').primaryKey(),
});

export const apiKeys = sqliteTable('api_keys', {
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  key: text('key')
    .notNull()
    .unique()
    .$defaultFn(() => generateApiKey()),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  id: text('id').primaryKey(),
});
