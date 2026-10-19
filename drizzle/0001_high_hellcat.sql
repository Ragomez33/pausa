CREATE TABLE `pause_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`trigger_emotion` text NOT NULL,
	`resisted` integer DEFAULT 1 NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_pause_events_created_at` ON `pause_events` (`created_at`);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `daily_cigarettes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `pack_cost` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `quit_goal` text;