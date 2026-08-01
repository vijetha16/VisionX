CREATE TABLE `posts` (`id` text PRIMARY KEY NOT NULL,`author_id` text NOT NULL,`organization_id` text NOT NULL,`content` text NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `post_likes` (`post_id` text NOT NULL,`user_id` text NOT NULL,`created_at` text NOT NULL,PRIMARY KEY(`post_id`,`user_id`));
--> statement-breakpoint
CREATE TABLE `post_comments` (`id` text PRIMARY KEY NOT NULL,`post_id` text NOT NULL,`author_id` text NOT NULL,`content` text NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `team_invites` (`id` text PRIMARY KEY NOT NULL,`organization_id` text NOT NULL,`inviter_id` text NOT NULL,`email` text NOT NULL,`role` text NOT NULL,`status` text NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `posts_created_idx` ON `posts` (`created_at`);
--> statement-breakpoint
CREATE INDEX `team_invites_email_status_idx` ON `team_invites` (`email`,`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_user_org_idx` ON `memberships` (`user_id`,`organization_id`);
