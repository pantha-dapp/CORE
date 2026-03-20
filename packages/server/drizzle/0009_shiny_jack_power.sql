CREATE TABLE `personal_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender_wallet` text NOT NULL,
	`recipient_wallet` text NOT NULL,
	`ciphertext` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`sender_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipient_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `feedpost` (
	`follower` text NOT NULL,
	`following` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	PRIMARY KEY(`follower`, `following`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `message_policy` text DEFAULT 'friends' NOT NULL;