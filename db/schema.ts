import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const metrics = sqliteTable("metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }), label: text("label").notNull(), value: text("value").notNull(), change: text("change").notNull(), tone: text("tone").notNull(), progress: real("progress").notNull(),
});
export const initiatives = sqliteTable("initiatives", {
  id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(), owner: text("owner").notNull(), team: text("team").notNull(), status: text("status").notNull(), progress: integer("progress").notNull(), due: text("due").notNull(),
});
export const insights = sqliteTable("insights", {
  id: integer("id").primaryKey({ autoIncrement: true }), severity: text("severity").notNull(), title: text("title").notNull(), detail: text("detail").notNull(), action: text("action").notNull(), status: text("status").notNull(),
});
export const activity = sqliteTable("activity", {
  id: integer("id").primaryKey({ autoIncrement: true }), actor: text("actor").notNull(), action: text("action").notNull(), timestamp: text("timestamp").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), email: text("email").notNull().unique(), name: text("name").notNull(), createdAt: text("created_at").notNull(),
});
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(), name: text("name").notNull(), slug: text("slug").notNull().unique(), createdAt: text("created_at").notNull(),
});
export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(), userId: text("user_id").notNull(), organizationId: text("organization_id").notNull(), role: text("role").notNull(), createdAt: text("created_at").notNull(),
});
export const workspaceRecords = sqliteTable("workspace_records", {
  id: text("id").primaryKey(), organizationId: text("organization_id").notNull(), type: text("type").notNull(), title: text("title").notNull(), subtitle: text("subtitle").notNull(), status: text("status").notNull(), value: text("value").notNull(), progress: integer("progress").notNull(), owner: text("owner").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});
