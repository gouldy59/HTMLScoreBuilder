import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  components: jsonb("components").notNull().default('[]'),
  variables: jsonb("variables").notNull().default('{}'),
  styles: jsonb("styles").notNull().default('{}'),
  version: integer("version").notNull().default(1),
  isLatest: boolean("is_latest").notNull().default(true),
  parentId: integer("parent_id"),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  isLatest: true,
  parentId: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Schema for creating new template versions
export const createVersionSchema = insertTemplateSchema.extend({
  changeDescription: z.string().optional(),
});

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CreateVersion = z.infer<typeof createVersionSchema>;
