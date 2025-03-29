import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  created_at: timestamp("created_at").defaultNow(),
  supabase_id: text("supabase_id").unique(),
  is_admin: boolean("is_admin").default(false),
});

// User interests
export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  categories: jsonb("categories").notNull(),
});

// API keys
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  gemini_key: text("gemini_key"),
});

// Saved articles
export const savedArticles = pgTable("saved_articles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  article_id: text("article_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  image_url: text("image_url"),
  source: text("source"),
  category: text("category"),
  published_at: text("published_at"),
  saved_at: timestamp("saved_at").defaultNow(),
});

// Admin logs
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  admin_id: integer("admin_id").references(() => users.id),
  action: text("action").notNull(),
  target_type: text("target_type").notNull(), // user, article, etc.
  target_id: text("target_id").notNull(),
  details: jsonb("details"),
  created_at: timestamp("created_at").defaultNow(),
});

// Zod schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

// Extended schema to handle supabase_id during creation
export const createUserSchema = insertUserSchema.extend({
  supabase_id: z.string().optional(),
});

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
});

export const insertSavedArticleSchema = createInsertSchema(savedArticles).omit({
  id: true,
  saved_at: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  created_at: true,
});

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertSavedArticle = z.infer<typeof insertSavedArticleSchema>;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;

// Types for select operations
export type User = typeof users.$inferSelect;
export type Interest = typeof interests.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type SavedArticle = typeof savedArticles.$inferSelect;
export type AdminLog = typeof adminLogs.$inferSelect;

// Category type
export const categorySchema = z.enum([
  "technology",
  "business",
  "science",
  "health",
  "entertainment",
  "sports",
  "politics",
  "environment",
  "finance",
  "general"
]);

export type Category = z.infer<typeof categorySchema>;
