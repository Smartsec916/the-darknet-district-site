import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User profiles for chat persistence
export const chatUserProfiles = pgTable("chat_user_profiles", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(), // Browser fingerprint or unique identifier
  displayName: text("display_name").notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  trustLevel: integer("trust_level").default(0),
  preferredMood: text("preferred_mood"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatUserProfileSchema = createInsertSchema(chatUserProfiles).pick({
  clientId: true,
  displayName: true,
  trustLevel: true,
  preferredMood: true,
});

export type InsertChatUserProfile = z.infer<typeof insertChatUserProfileSchema>;
export type ChatUserProfile = typeof chatUserProfiles.$inferSelect;

// Chat session schema
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  clientId: text("client_id"),  // Optional link to a user profile for persistent sessions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
  clientId: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

// Chat messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  sender: text("sender").notNull(), // 'user' or 'iris'
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  // Added for conversation history; see server/migrate.ts (all additive)
  language: text("language"), // language Iris detected for this exchange
  status: text("status").notNull().default("ok"), // ok | fallback (canned reply) | error (no reply produced)
  requestId: text("request_id"), // server-side key that stops the same exchange being saved twice
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  sender: true,
  message: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
