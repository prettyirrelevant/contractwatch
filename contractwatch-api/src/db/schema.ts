import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { Abi } from 'abitype/zod';
import { z } from 'zod';

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
  contractAddress: text('contract_address', { length: 42 })
    .$type<`0x${string}`>()
    .notNull()
    .references(() => contracts.address, { onDelete: 'cascade' }),
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
  name: text('name', { length: 100 }).notNull(),
  startBlock: integer('start_block').notNull(),
  id: text('id').primaryKey(),
});

export const contracts = sqliteTable('contracts', {
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  address: text('address', { length: 42 }).$type<`0x${string}`>().notNull().unique(),
  abi: text('abi', { mode: 'json' }).$type<z.infer<typeof Abi>>().notNull(),
  lastQueriedBlock: integer('last_queried_block').notNull().default(-1),
  creationTxHash: text('creation_transaction_hash').notNull(),
  creationBlock: integer('creation_block').notNull(),
  id: text('id').primaryKey(),
});

// todo: improve this. allow blocks to be filtered, allow args to be filtered also.
export const events = sqliteTable('events', {
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
  contractAddress: text('contract_address')
    .notNull()
    .references(() => contracts.address, { onDelete: 'cascade' }),
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
