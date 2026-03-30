CREATE TABLE `learning_group_chats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_group_chats_category_unique` ON `learning_group_chats` (`category`);--> statement-breakpoint
CREATE TABLE `learning_group_courses` (
	`learning_group_chat_id` integer NOT NULL,
	`course_id` text NOT NULL,
	FOREIGN KEY (`learning_group_chat_id`) REFERENCES `learning_group_chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learning_group_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`learning_group_chat_id` integer NOT NULL,
	`sender_wallet` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`learning_group_chat_id`) REFERENCES `learning_group_chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_feedpost` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_feedpost`("id", "type", "created_at", "updated_at", "deleted_at") SELECT "id", "type", "created_at", "updated_at", "deleted_at" FROM `feedpost`;--> statement-breakpoint
DROP TABLE `feedpost`;--> statement-breakpoint
ALTER TABLE `__new_feedpost` RENAME TO `feedpost`;--> statement-breakpoint
PRAGMA foreign_keys=ON;