CREATE TABLE `user_profile_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`daily_cigarettes` integer NOT NULL,
	`pack_cost` real NOT NULL,
	`currency` text NOT NULL,
	`quit_goal` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `user_profile_new` (`id`, `daily_cigarettes`, `pack_cost`, `currency`, `quit_goal`, `created_at`)
SELECT
	`id`,
	`daily_cigarettes`,
	`pack_cost`,
	`currency`,
	COALESCE(`quit_goal`, ''),
	strftime('%Y-%m-%dT%H:%M:%fZ', `created_at` / 1000.0, 'unixepoch')
FROM `user_profile`;
--> statement-breakpoint
DROP TABLE `user_profile`;
--> statement-breakpoint
ALTER TABLE `user_profile_new` RENAME TO `user_profile`;
--> statement-breakpoint
CREATE TABLE `pause_events_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`trigger_emotion` text NOT NULL,
	`resisted` integer NOT NULL,
	`notes` text
);
--> statement-breakpoint
INSERT INTO `pause_events_new` (`id`, `timestamp`, `trigger_emotion`, `resisted`, `notes`)
SELECT
	`id`,
	strftime('%Y-%m-%dT%H:%M:%fZ', `created_at` / 1000.0, 'unixepoch'),
	`trigger_emotion`,
	`resisted`,
	`notes`
FROM `pause_events`;
--> statement-breakpoint
DROP TABLE `pause_events`;
--> statement-breakpoint
ALTER TABLE `pause_events_new` RENAME TO `pause_events`;
--> statement-breakpoint
CREATE INDEX `idx_pause_events_timestamp` ON `pause_events` (`timestamp`);
