CREATE TABLE `inventory_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text NOT NULL,
	`action_type` text NOT NULL,
	`quantity` integer NOT NULL,
	`cost` real
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_logs_timestamp` ON `inventory_logs` (`timestamp`);
