CREATE TABLE `smoke_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`reason` text,
	`postponed` integer DEFAULT 0 NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_smoke_logs_created_at` ON `smoke_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `supply_inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchased_at` integer NOT NULL,
	`pack_count` integer DEFAULT 1 NOT NULL,
	`cigarettes_per_pack` integer DEFAULT 20 NOT NULL,
	`remaining_cigarettes` integer NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_supply_inventory_purchased_at` ON `supply_inventory` (`purchased_at`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text,
	`daily_target` integer DEFAULT 0 NOT NULL,
	`smoke_interval_minutes` integer DEFAULT 0 NOT NULL,
	`pack_size` integer DEFAULT 20 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
