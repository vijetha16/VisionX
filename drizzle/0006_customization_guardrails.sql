CREATE TABLE `customization_rules` (`id` text PRIMARY KEY NOT NULL,`organization_id` text NOT NULL,`author_id` text NOT NULL,`title` text NOT NULL,`requirement` text NOT NULL,`target_module` text NOT NULL,`level` integer NOT NULL,`compatibility` integer NOT NULL,`status` text NOT NULL,`plan_json` text NOT NULL,`version` integer NOT NULL,`created_at` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `customization_audit` (`id` text PRIMARY KEY NOT NULL,`rule_id` text NOT NULL,`organization_id` text NOT NULL,`actor_id` text NOT NULL,`event` text NOT NULL,`snapshot_json` text NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `customization_rules_org_updated_idx` ON `customization_rules` (`organization_id`,`updated_at`);
--> statement-breakpoint
CREATE INDEX `customization_audit_rule_created_idx` ON `customization_audit` (`rule_id`,`created_at`);
