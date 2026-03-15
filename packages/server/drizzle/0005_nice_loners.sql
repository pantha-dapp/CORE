CREATE TABLE `user_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`previous_id` text NOT NULL,
	`user_wallet` text NOT NULL,
	`label` text NOT NULL,
	`data` text NOT NULL,
	`signature` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_action_prev_hash_idx` ON `user_actions` (`previous_id`,`user_wallet`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_action_user_wallet_idx` ON `user_actions` (`user_wallet`,`id`);--> statement-breakpoint
CREATE TABLE `user_answer_logs` (
	`id` text,
	`page_id` text NOT NULL,
	`correct` integer NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `chapter_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_xp_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL,
	`xp_gained` real NOT NULL,
	`transaction_hash` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_course_chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`order` integer NOT NULL,
	`intent` text NOT NULL,
	`icon` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_course_chapters`("id", "course_id", "title", "description", "order", "intent", "icon") SELECT "id", "course_id", "title", "description", "order", "intent", "icon" FROM `course_chapters`;--> statement-breakpoint
DROP TABLE `course_chapters`;--> statement-breakpoint
ALTER TABLE `__new_course_chapters` RENAME TO `course_chapters`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_course_chapters_course_id` ON `course_chapters` (`course_id`);--> statement-breakpoint
CREATE TABLE `__new_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_courses`("id", "title", "description", "icon", "created_at", "updated_at", "deleted_at") SELECT "id", "title", "description", "icon", "created_at", "updated_at", "deleted_at" FROM `courses`;--> statement-breakpoint
DROP TABLE `courses`;--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;--> statement-breakpoint
CREATE TABLE `__new_user_daily_activity` (
	`user_wallet` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_wallet`, `date`),
	FOREIGN KEY (`user_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_daily_activity`("user_wallet", "date", "created_at") SELECT "user_wallet", "date", "created_at" FROM `user_daily_activity`;--> statement-breakpoint
DROP TABLE `user_daily_activity`;--> statement-breakpoint
ALTER TABLE `__new_user_daily_activity` RENAME TO `user_daily_activity`;--> statement-breakpoint
CREATE UNIQUE INDEX `uq_chapter_pages_chapter_id_order` ON `chapter_pages` (`chapter_id`,`order`);