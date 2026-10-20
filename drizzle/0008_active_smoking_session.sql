CREATE TABLE `active_smoking_session` (
	`id` text PRIMARY KEY NOT NULL,
	`trigger_emotion` text NOT NULL,
	`started_at_ms` integer NOT NULL,
	`created_at` text NOT NULL
);
