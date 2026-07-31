CREATE TABLE `metrics` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `label` text NOT NULL, `value` text NOT NULL, `change` text NOT NULL, `tone` text NOT NULL, `progress` real NOT NULL);
--> statement-breakpoint
CREATE TABLE `initiatives` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `title` text NOT NULL, `owner` text NOT NULL, `team` text NOT NULL, `status` text NOT NULL, `progress` integer NOT NULL, `due` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `insights` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `severity` text NOT NULL, `title` text NOT NULL, `detail` text NOT NULL, `action` text NOT NULL, `status` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `activity` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `actor` text NOT NULL, `action` text NOT NULL, `timestamp` text NOT NULL);
