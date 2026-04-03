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
CREATE TABLE `vector_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`last_hit_at` integer NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_actions` (
	`hash` text PRIMARY KEY NOT NULL,
	`previous_id` text NOT NULL,
	`user_wallet` text NOT NULL,
	`label` text NOT NULL,
	`data` text NOT NULL,
	`signature` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_action_prev_hash_idx` ON `user_actions` (`previous_id`,`user_wallet`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_action_user_wallet_idx` ON `user_actions` (`user_wallet`,`hash`);--> statement-breakpoint
CREATE TABLE `user_answer_logs` (
	`id` text,
	`page_id` text NOT NULL,
	`correct` integer NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `chapter_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL,
	`txn_hash` text NOT NULL,
	`data_uri` text NOT NULL,
	`token_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `user_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL,
	`course_id` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`wallet_address` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`last_active_at` integer NOT NULL,
	`name` text,
	`timezone` text DEFAULT 'Europe/London' NOT NULL,
	`profile_visibility` text DEFAULT 'public' NOT NULL,
	`follow_policy` text DEFAULT 'anyone' NOT NULL,
	`message_policy` text DEFAULT 'friends' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `feedpost` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_wallet` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `followings` (
	`follower` text NOT NULL,
	`following` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	PRIMARY KEY(`follower`, `following`)
);
--> statement-breakpoint
CREATE TABLE `token_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`contract_address` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chapter_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_id` text NOT NULL,
	`order` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `course_chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_chapter_pages_chapter_id_order` ON `chapter_pages` (`chapter_id`,`order`);--> statement-breakpoint
CREATE TABLE `chapter_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_id` text NOT NULL,
	`topic` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `course_chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chapter_topics_chapter_id` ON `chapter_topics` (`chapter_id`);--> statement-breakpoint
CREATE TABLE `course_chapters` (
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
CREATE INDEX `idx_course_chapters_course_id` ON `course_chapters` (`course_id`);--> statement-breakpoint
CREATE TABLE `course_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`topic` text NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_course_topics_course_id` ON `course_topics` (`course_id`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `user_purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL,
	`item_id` text NOT NULL,
	`tx_hash` text NOT NULL,
	`contract_version` integer NOT NULL,
	`consumed` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contract_version`) REFERENCES `token_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `friend_streaks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet1` text NOT NULL,
	`user_wallet2` text NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_daily_activity` (
	`user_wallet` text NOT NULL,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_wallet`, `date`),
	FOREIGN KEY (`user_wallet`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_streaks` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`wallet_address`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_xp_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_wallet` text NOT NULL,
	`xp_gained` real NOT NULL,
	`contract_version` integer NOT NULL,
	`transaction_hash` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`contract_version`) REFERENCES `token_versions`(`id`) ON UPDATE no action ON DELETE no action
);
