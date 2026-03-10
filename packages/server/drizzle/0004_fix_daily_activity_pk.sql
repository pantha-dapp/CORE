-- Fix: user_daily_activity had only `user_wallet` as PK which caused the
-- onConflictDoNothing to fire on day 2+, silently skipping streak updates.
-- The correct PK is the composite (user_wallet, date).

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_daily_activity` (
	`user_wallet` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_wallet`, `date`)
);--> statement-breakpoint
INSERT INTO `__new_user_daily_activity`("user_wallet", "date", "created_at")
	SELECT "user_wallet", "date", "created_at" FROM `user_daily_activity`;--> statement-breakpoint
DROP TABLE `user_daily_activity`;--> statement-breakpoint
ALTER TABLE `__new_user_daily_activity` RENAME TO `user_daily_activity`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
