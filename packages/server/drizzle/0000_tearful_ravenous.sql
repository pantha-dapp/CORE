CREATE TABLE `vector_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`last_hit_at` integer NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL
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
CREATE TABLE `users` (
	`wallet_address` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`last_active_at` integer NOT NULL,
	`name` text,
	`timezone` text DEFAULT 'Europe/London' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `followings` (
	`follower` text NOT NULL,
	`following` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
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
	`icon` text,
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
	`icon` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
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
	`user_wallet` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
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
