DROP TABLE IF EXISTS `team_members`;
--> statement-breakpoint
DROP TABLE IF EXISTS `teams`;
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`invite_code` text NOT NULL,
	`difficulty_level` text NOT NULL,
	`duration_days` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_teams_invite_code` ON `teams` (`invite_code`);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_name` text NOT NULL,
	`daily_limit` integer NOT NULL,
	`role` text NOT NULL,
	`joined_at` text NOT NULL,
	`postponed_count` integer DEFAULT 0 NOT NULL,
	`smoked_today` integer DEFAULT 0 NOT NULL,
	`streak_days` integer DEFAULT 0 NOT NULL,
	`had_stumble` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_team_members_team_id` ON `team_members` (`team_id`);
