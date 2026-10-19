CREATE TABLE `team_event_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_name` text NOT NULL,
	`event_type` text NOT NULL,
	`timestamp` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_team_event_outbox_status` ON `team_event_outbox` (`status`, `created_at`);
