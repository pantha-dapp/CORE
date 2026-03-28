CREATE TABLE `user_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL,
	`txn_hash` text NOT NULL,
	`data_uri` text NOT NULL,
	`token_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
