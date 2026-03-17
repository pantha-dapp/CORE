CREATE TABLE `token_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`contract_address` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `user_xp_log` ADD `contract_version` integer NOT NULL REFERENCES token_versions(id);