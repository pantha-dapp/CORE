CREATE TABLE `user_purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL,
	`item_id` text NOT NULL,
	`contract_version` integer NOT NULL,
	`consumed` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contract_version`) REFERENCES `token_versions`(`id`) ON UPDATE no action ON DELETE no action
);
