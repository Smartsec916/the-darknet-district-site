import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
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
  memoryKey: text("memory_key"), // whose conversation this is, for long-term memory (null on older rows)
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  sender: true,
  message: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Iris's memory of each visitor (see server/relationships.ts); created by server/migrate.ts
export const irisRelationships = pgTable("iris_relationships", {
  clientId: text("client_id").primaryKey(),
  trust: real("trust").notNull().default(1),
  familiarity: real("familiarity").notNull().default(0),
  affection: real("affection").notNull().default(0),
  respect: real("respect").notNull().default(0.5),
  playfulness: real("playfulness").notNull().default(0.3),
  mood: text("mood").notNull().default("professional"),
  visits: integer("visits").notNull().default(0),
  messages: integer("messages").notNull().default(0),
  firstSeen: timestamp("first_seen").defaultNow().notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  preferences: text("preferences").notNull().default("[]"),
  recap: text("recap").notNull().default(""),
  flirtCooldown: integer("flirt_cooldown").notNull().default(0),
  minor: boolean("minor").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// The administrator's chosen Iris interaction mode and test-visitor resets (see server/identity.ts)
export const irisOwnerState = pgTable("iris_owner_state", {
  uid: text("uid").primaryKey(),
  mode: text("mode").notNull().default("owner"),
  newNonce: integer("new_nonce").notNull().default(0),
  returningNonce: integer("returning_nonce").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Anonymous browsers a signed-in account has chosen to bring into its memory (see server/memory.ts)
export const irisMemoryLinks = pgTable("iris_memory_links", {
  accountKey: text("account_key").notNull(),
  sourceKey: text("source_key").notNull(),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
});
