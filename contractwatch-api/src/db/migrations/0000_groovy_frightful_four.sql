CREATE TABLE `accounts` (
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`address` text(42) NOT NULL,
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`account_id` text NOT NULL,
	`key` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`contract_address` text(42) NOT NULL,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`account_id` text NOT NULL,
	`name` text(100) NOT NULL,
	`start_block` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`contract_address`) REFERENCES `contracts`(`address`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`address` text(42) NOT NULL,
	`abi` text NOT NULL,
	`last_queried_block` integer DEFAULT -1 NOT NULL,
	`creation_transaction_hash` text NOT NULL,
	`creation_block` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_address_unique` ON `accounts` (`address`);--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_unique` ON `api_keys` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `contracts_address_unique` ON `contracts` (`address`);