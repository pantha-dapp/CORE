PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user_sessions`("id", "user_wallet") SELECT "id", "user_wallet" FROM `user_sessions`;--> statement-breakpoint
DROP TABLE `user_sessions`;--> statement-breakpoint
ALTER TABLE `__new_user_sessions` RENAME TO `user_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `users` ADD `profile_visibility` text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `follow_policy` text DEFAULT 'anyone' NOT NULL;