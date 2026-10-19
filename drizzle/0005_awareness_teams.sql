ALTER TABLE `user_profile` ADD `postponed_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE `smoking_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`trigger_emotion` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`inventory_decremented` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_smoking_events_timestamp` ON `smoking_events` (`timestamp`);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`goal_level` text NOT NULL,
	`duration_days` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`local_name` text NOT NULL,
	`daily_limit` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_team_members_team_id` ON `team_members` (`team_id`);
