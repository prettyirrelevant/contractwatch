CREATE TABLE `events` (
	`updated_at` integer NOT NULL,
	`address` text NOT NULL,
	`created_at` integer NOT NULL,
	`topics` text NOT NULL,
	`args` text NOT NULL,
	`block_hash` text,
	`data` text NOT NULL,
	`transaction_index` integer,
	`block_number` integer,
	`transaction_hash` text,
	`log_index` integer,
	`name` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`address`) REFERENCES `contracts`(`address`) ON UPDATE no action ON DELETE cascade
);
