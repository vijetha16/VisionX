CREATE TABLE `users` (`id` text PRIMARY KEY NOT NULL, `email` text NOT NULL UNIQUE, `name` text NOT NULL, `created_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `organizations` (`id` text PRIMARY KEY NOT NULL, `name` text NOT NULL, `slug` text NOT NULL UNIQUE, `created_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `memberships` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL, `organization_id` text NOT NULL, `role` text NOT NULL, `created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `memberships_user_idx` ON `memberships` (`user_id`);
--> statement-breakpoint
CREATE TABLE `workspace_records` (`id` text PRIMARY KEY NOT NULL, `organization_id` text NOT NULL, `type` text NOT NULL, `title` text NOT NULL, `subtitle` text NOT NULL, `status` text NOT NULL, `value` text NOT NULL, `progress` integer NOT NULL, `owner` text NOT NULL, `created_at` text NOT NULL, `updated_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `workspace_records_org_type_idx` ON `workspace_records` (`organization_id`,`type`);
