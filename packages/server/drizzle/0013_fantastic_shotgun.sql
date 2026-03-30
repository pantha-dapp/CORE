ALTER TABLE `user_actions` RENAME COLUMN "id" TO "hash";--> statement-breakpoint
DROP INDEX `user_action_user_wallet_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_action_user_wallet_idx` ON `user_actions` (`user_wallet`,`hash`);