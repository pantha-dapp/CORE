DROP TABLE `feedpost`;

--> statement-breakpoint
CREATE TABLE
    `feedpost` (
        `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        `user_wallet` text NOT NULL,
        `payload` text NOT NULL,
        `created_at` integer DEFAULT (unixepoch ()) NOT NULL,
        `updated_at` integer DEFAULT (unixepoch ()) NOT NULL,
        `deleted_at` integer
    );
