CREATE TABLE `profiles` (`user_id` text PRIMARY KEY NOT NULL, `headline` text NOT NULL DEFAULT '', `location` text NOT NULL DEFAULT '', `bio` text NOT NULL DEFAULT '', `skills` text NOT NULL DEFAULT '', `resume_name` text NOT NULL DEFAULT '', `resume_key` text NOT NULL DEFAULT '', `updated_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `connections` (`id` text PRIMARY KEY NOT NULL, `requester_id` text NOT NULL, `recipient_id` text NOT NULL, `status` text NOT NULL, `created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `connections_people_idx` ON `connections` (`requester_id`,`recipient_id`);
