ALTER TABLE `user_profile` ADD COLUMN `updated_at` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_profile` ADD COLUMN `owner_user_id` text;
--> statement-breakpoint
ALTER TABLE `pause_events` ADD COLUMN `sync_id` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `pause_events` ADD COLUMN `owner_user_id` text;
--> statement-breakpoint
ALTER TABLE `smoking_events` ADD COLUMN `sync_id` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `smoking_events` ADD COLUMN `owner_user_id` text;
--> statement-breakpoint
ALTER TABLE `inventory_logs` ADD COLUMN `sync_id` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `inventory_logs` ADD COLUMN `owner_user_id` text;
--> statement-breakpoint
ALTER TABLE `user_badges` ADD COLUMN `sync_id` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_badges` ADD COLUMN `owner_user_id` text;
--> statement-breakpoint
DROP INDEX IF EXISTS `idx_user_badges_badge_key`;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_user_badges_owner_badge` ON `user_badges` (`owner_user_id`, `badge_key`);
--> statement-breakpoint
CREATE TABLE `global_sync_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_global_sync_outbox_entity` ON `global_sync_outbox` (`entity_type`, `entity_id`);
--> statement-breakpoint
CREATE INDEX `idx_global_sync_outbox_status` ON `global_sync_outbox` (`status`, `created_at`);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
