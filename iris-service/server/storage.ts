import { 
  users, 
  chatSessions,
  chatMessages,
  chatUserProfiles,
  type User, 
  type InsertUser, 
  type ChatSession,
  type ChatMessage,
  type ChatUserProfile,
  type InsertChatUserProfile
} from "@shared/schema";
import { db } from "./db";
import { eq, inArray, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat methods
  createChatSession(sessionId: string, clientId?: string): Promise<void>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  saveChatMessage(message: { sessionId: string, sender: string, message: string }): Promise<void>;
  getChatHistory(sessionId: string): Promise<ChatMessage[]>;
  
  // User profile methods for persistent chat experience
  getUserProfile(clientId: string): Promise<ChatUserProfile | undefined>;
  createOrUpdateUserProfile(profile: { 
    clientId: string, 
    displayName: string, 
    trustLevel?: number, 
    preferredMood?: string 
  }): Promise<ChatUserProfile>;
  updateUserLastSeen(clientId: string): Promise<void>;
  
  // Special users methods for Eva and Admin conversation memory
  getSpecialUserConversations(specialUserName: string): Promise<{ 
    session_id: string, 
    timestamp: Date, 
    message_count: number 
  }[]>;
  getRecentMessagesForSpecialUser(specialUserName: string, limit?: number): Promise<{
    message: string,
    sender: string,
    timestamp: Date
  }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createChatSession(sessionId: string, clientId?: string): Promise<void> {
    await db
      .insert(chatSessions)
      .values({ 
        sessionId,
        clientId
      })
      .returning();
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId));
    return session;
  }

  async saveChatMessage(messageData: { sessionId: string, sender: string, message: string }): Promise<void> {
    await db
      .insert(chatMessages)
      .values({
        sessionId: messageData.sessionId,
        sender: messageData.sender,
        message: messageData.message
      });
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  // User profile methods
  async getUserProfile(clientId: string): Promise<ChatUserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(chatUserProfiles)
      .where(eq(chatUserProfiles.clientId, clientId));
    
    return profile;
  }

  async createOrUpdateUserProfile(profileData: { 
    clientId: string, 
    displayName: string, 
    trustLevel?: number, 
    preferredMood?: string 
  }): Promise<ChatUserProfile> {
    // Check if profile exists
    const existingProfile = await this.getUserProfile(profileData.clientId);
    
    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db
        .update(chatUserProfiles)
        .set({
          displayName: profileData.displayName,
          lastSeen: new Date(),
          ...(profileData.trustLevel !== undefined && { trustLevel: profileData.trustLevel }),
          ...(profileData.preferredMood && { preferredMood: profileData.preferredMood })
        })
        .where(eq(chatUserProfiles.clientId, profileData.clientId))
        .returning();
      
      return updatedProfile;
    } else {
      // Create new profile
      const [newProfile] = await db
        .insert(chatUserProfiles)
        .values({
          clientId: profileData.clientId,
          displayName: profileData.displayName,
          trustLevel: profileData.trustLevel || 0,
          preferredMood: profileData.preferredMood
        })
        .returning();
      
      return newProfile;
    }
  }

  async updateUserLastSeen(clientId: string): Promise<void> {
    await db
      .update(chatUserProfiles)
      .set({ lastSeen: new Date() })
      .where(eq(chatUserProfiles.clientId, clientId));
  }
  
  // Implementation of methods for Eva and Admin conversation memory
  async getSpecialUserConversations(specialUserName: string): Promise<{ 
    session_id: string, 
    timestamp: Date, 
    message_count: number 
  }[]> {
    // Exact display names only, so visitors whose names merely contain "eva" or "admin" aren't included
    const aliases = specialUserName.toLowerCase() === "admin"
      ? ["admin"]
      : ["eva", "wang li", "王力", "wang", "li", "王", "力"];
    const matchingProfiles = await db
      .select()
      .from(chatUserProfiles)
      .where(inArray(sql`LOWER(${chatUserProfiles.displayName})`, aliases));

    if (!matchingProfiles.length) {
      return [];
    }

    // Extract client IDs from matching profiles
    const clientIds = matchingProfiles.map(profile => profile.clientId);

    // Find all sessions for these special users
    const sessions = await db
      .select({
        session_id: chatSessions.sessionId,
        timestamp: chatSessions.createdAt,
      })
      .from(chatSessions)
      .where(inArray(chatSessions.clientId, clientIds))
      .orderBy(chatSessions.createdAt); // original order (oldest first)
    
    // For each session, count the number of messages
    const result = await Promise.all(
      sessions.map(async (session) => {
        const messagesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(chatMessages)
          .where(eq(chatMessages.sessionId, session.session_id));
        
        return {
          session_id: session.session_id,
          timestamp: session.timestamp,
          message_count: messagesCount[0]?.count || 0
        };
      })
    );
    
    return result;
  }
  
  async getRecentMessagesForSpecialUser(specialUserName: string, limit: number = 50): Promise<{
    message: string,
    sender: string,
    timestamp: Date,
    sessionId: string
  }[]> {
    // First get all conversations from this special user
    const conversations = await this.getSpecialUserConversations(specialUserName);
    
    if (!conversations.length) {
      return [];
    }
    
    // Get all session IDs
    const sessionIds = conversations.map(convo => convo.session_id);
    
    // Get the most recent messages from these sessions
    const messages = await db
      .select({
        message: chatMessages.message,
        sender: chatMessages.sender,
        timestamp: chatMessages.timestamp,
        sessionId: chatMessages.sessionId
      })
      .from(chatMessages)
      .where(inArray(chatMessages.sessionId, sessionIds))
      .orderBy(chatMessages.timestamp) // original order (oldest first)
      .limit(limit);
      
    return messages;
  }
}

export const storage = new DatabaseStorage();
