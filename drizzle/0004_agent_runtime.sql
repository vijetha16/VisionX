CREATE TABLE `agent_runs` (`id` text PRIMARY KEY NOT NULL, `organization_email` text NOT NULL, `agent_type` text NOT NULL, `input` text NOT NULL, `status` text NOT NULL, `output_json` text NOT NULL, `mode` text NOT NULL, `created_at` text NOT NULL, `completed_at` text);
--> statement-breakpoint
CREATE TABLE `agent_audit_log` (`id` text PRIMARY KEY NOT NULL, `run_id` text NOT NULL, `actor_email` text NOT NULL, `event` text NOT NULL, `detail` text NOT NULL, `created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `agent_runs_org_idx` ON `agent_runs` (`organization_email`,`created_at`);
