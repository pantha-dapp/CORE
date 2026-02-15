CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL,
	FOREIGN KEY (`user_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE cascade
);
