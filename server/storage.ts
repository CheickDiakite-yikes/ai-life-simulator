import { 
  users, gameSaves, lifeEvents, chatMessages,
  type User, type InsertUser,
  type GameSave, type InsertGameSave,
  type LifeEventRecord, type InsertLifeEvent,
  type ChatMessage, type InsertChatMessage
} from "../shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getGameSave(id: number): Promise<GameSave | undefined>;
  getGameSavesByUser(userId: number): Promise<GameSave[]>;
  createGameSave(save: InsertGameSave): Promise<GameSave>;
  updateGameSave(id: number, save: Partial<InsertGameSave>): Promise<GameSave | undefined>;
  deleteGameSave(id: number): Promise<void>;
  
  getLifeEvents(gameSaveId: number): Promise<LifeEventRecord[]>;
  createLifeEvent(event: InsertLifeEvent): Promise<LifeEventRecord>;
  
  getChatMessages(userId: number, gameSaveId?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(userId: number, gameSaveId?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getGameSave(id: number): Promise<GameSave | undefined> {
    const [save] = await db.select().from(gameSaves).where(eq(gameSaves.id, id));
    return save || undefined;
  }

  async getGameSavesByUser(userId: number): Promise<GameSave[]> {
    return db.select().from(gameSaves).where(eq(gameSaves.userId, userId)).orderBy(desc(gameSaves.updatedAt));
  }

  async createGameSave(save: InsertGameSave): Promise<GameSave> {
    const [created] = await db.insert(gameSaves).values(save).returning();
    return created;
  }

  async updateGameSave(id: number, save: Partial<InsertGameSave>): Promise<GameSave | undefined> {
    const [updated] = await db
      .update(gameSaves)
      .set({ ...save, updatedAt: new Date() })
      .where(eq(gameSaves.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteGameSave(id: number): Promise<void> {
    await db.delete(lifeEvents).where(eq(lifeEvents.gameSaveId, id));
    await db.delete(chatMessages).where(eq(chatMessages.gameSaveId, id));
    await db.delete(gameSaves).where(eq(gameSaves.id, id));
  }

  async getLifeEvents(gameSaveId: number): Promise<LifeEventRecord[]> {
    return db.select().from(lifeEvents).where(eq(lifeEvents.gameSaveId, gameSaveId));
  }

  async createLifeEvent(event: InsertLifeEvent): Promise<LifeEventRecord> {
    const [created] = await db.insert(lifeEvents).values(event).returning();
    return created;
  }

  async getChatMessages(userId: number, gameSaveId?: number): Promise<ChatMessage[]> {
    if (gameSaveId) {
      return db.select().from(chatMessages)
        .where(eq(chatMessages.gameSaveId, gameSaveId));
    }
    return db.select().from(chatMessages).where(eq(chatMessages.userId, userId));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async clearChatMessages(userId: number, gameSaveId?: number): Promise<void> {
    if (gameSaveId) {
      await db.delete(chatMessages).where(eq(chatMessages.gameSaveId, gameSaveId));
    } else {
      await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
    }
  }
}

export const storage = new DatabaseStorage();
