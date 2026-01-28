import { 
  users, gameSaves, lifeEvents, chatMessages, sessions,
  type User, type InsertUser,
  type GameSave, type InsertGameSave,
  type LifeEvent, type InsertLifeEvent,
  type ChatMessage, type InsertChatMessage,
  type Session, type InsertSession
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, lt } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  
  getSave(id: number): Promise<GameSave | undefined>;
  getSavesByUser(userId: number): Promise<GameSave[]>;
  createSave(save: InsertGameSave): Promise<GameSave>;
  updateSave(id: number, data: Partial<GameSave>): Promise<GameSave | undefined>;
  deleteSave(id: number): Promise<void>;
  
  getEventsBySave(saveId: number): Promise<LifeEvent[]>;
  createEvent(event: InsertLifeEvent): Promise<LifeEvent>;
  
  getMessagesBySave(saveId: number): Promise<ChatMessage[]>;
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email.toLowerCase()
    }).returning();
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }

  async getSave(id: number): Promise<GameSave | undefined> {
    const [save] = await db.select().from(gameSaves).where(eq(gameSaves.id, id));
    return save || undefined;
  }

  async getSavesByUser(userId: number): Promise<GameSave[]> {
    return await db.select().from(gameSaves)
      .where(eq(gameSaves.userId, userId))
      .orderBy(desc(gameSaves.updatedAt));
  }

  async createSave(insertSave: InsertGameSave): Promise<GameSave> {
    const [save] = await db.insert(gameSaves).values(insertSave).returning();
    return save;
  }

  async updateSave(id: number, data: Partial<GameSave>): Promise<GameSave | undefined> {
    const [save] = await db.update(gameSaves)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(gameSaves.id, id))
      .returning();
    return save || undefined;
  }

  async deleteSave(id: number): Promise<void> {
    await db.delete(lifeEvents).where(eq(lifeEvents.gameSaveId, id));
    await db.delete(chatMessages).where(eq(chatMessages.gameSaveId, id));
    await db.delete(gameSaves).where(eq(gameSaves.id, id));
  }

  async getEventsBySave(saveId: number): Promise<LifeEvent[]> {
    return await db.select().from(lifeEvents)
      .where(eq(lifeEvents.gameSaveId, saveId))
      .orderBy(desc(lifeEvents.createdAt));
  }

  async createEvent(insertEvent: InsertLifeEvent): Promise<LifeEvent> {
    const [event] = await db.insert(lifeEvents).values(insertEvent).returning();
    return event;
  }

  async getMessagesBySave(saveId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.gameSaveId, saveId))
      .orderBy(chatMessages.createdAt);
  }

  async createMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
