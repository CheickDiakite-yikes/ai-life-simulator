import { pgTable, serial, text, timestamp, jsonb, integer, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameSaves = pgTable("game_saves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  mode: text("mode").notNull(),
  theme: text("theme"),
  gameDate: text("game_date"),
  timeStep: text("time_step"),
  character: jsonb("character"),
  currentEvent: jsonb("current_event"),
  history: jsonb("history"),
  config: jsonb("config"),
  storyArcs: jsonb("story_arcs"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lifeEvents = pgTable("life_events", {
  id: serial("id").primaryKey(),
  gameSaveId: integer("game_save_id").references(() => gameSaves.id).notNull(),
  year: integer("year").notNull(),
  date: text("date"),
  description: text("description"),
  visualPrompt: text("visual_prompt"),
  type: text("type"),
  choices: jsonb("choices"),
  selectedChoice: text("selected_choice"),
  news: jsonb("news"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  gameSaveId: integer("game_save_id").references(() => gameSaves.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  saves: many(gameSaves),
  messages: many(chatMessages),
}));

export const gameSavesRelations = relations(gameSaves, ({ one, many }) => ({
  user: one(users, {
    fields: [gameSaves.userId],
    references: [users.id],
  }),
  events: many(lifeEvents),
  messages: many(chatMessages),
}));

export const lifeEventsRelations = relations(lifeEvents, ({ one }) => ({
  save: one(gameSaves, {
    fields: [lifeEvents.gameSaveId],
    references: [gameSaves.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  save: one(gameSaves, {
    fields: [chatMessages.gameSaveId],
    references: [gameSaves.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type GameSave = typeof gameSaves.$inferSelect;
export type InsertGameSave = typeof gameSaves.$inferInsert;
export type LifeEvent = typeof lifeEvents.$inferSelect;
export type InsertLifeEvent = typeof lifeEvents.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
