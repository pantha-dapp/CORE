PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_followings` (
	`follower` text NOT NULL,
	`following` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	PRIMARY KEY(`follower`, `following`)
);
--> statement-breakpoint
INSERT INTO `__new_followings`("follower", "following", "created_at", "updated_at", "deleted_at") SELECT "follower", "following", "created_at", "updated_at", "deleted_at" FROM `followings`;--> statement-breakpoint
DROP TABLE `followings`;--> statement-breakpoint
ALTER TABLE `__new_followings` RENAME TO `followings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;