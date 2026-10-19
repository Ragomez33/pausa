CREATE TABLE `user_badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`badge_key` text NOT NULL,
	`unlocked_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_badges_badge_key` ON `user_badges` (`badge_key`);
