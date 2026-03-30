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
--> statement-breakpoint
ALTER TABLE `user_actions` ADD `seq` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `feedpost` ADD `user_wallet` text NOT NULL;--> statement-breakpoint
ALTER TABLE `feedpost` ADD `payload` text NOT NULL;--> statement-breakpoint
ALTER TABLE `feedpost` DROP COLUMN `type`;