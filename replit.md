# Aetheria - Life Simulator

## Overview
Aetheria is a hyper-realistic life simulator using React, TypeScript, and Vite, integrated with Google Gemini AI for generating characters, life events, and multimedia content.

## Current State
- Frontend running on port 5000 (Vite + React)
- Backend API running on port 3000 (Express)
- PostgreSQL database for persistence
- Gemini AI integration using GEMINI_API_KEY environment secret

## Architecture

### Frontend (React + Vite)
- `App.tsx` - Main application component with game state management
- `components/` - UI components (Dashboard, ChatInterface, ApiKeyModal, etc.)
- `services/` - Business logic (geminiService, apiKey, simulationMemory, etc.)
- `types.ts` - TypeScript type definitions

### Backend (Express)
- `server/index.ts` - Express API endpoints
- `server/db.ts` - Drizzle database connection
- `server/storage.ts` - Database storage layer with IStorage interface

### Database Schema
- `users` - User profiles
- `game_saves` - Game state saves with character data
- `life_events` - Historical life events for each save
- `chat_messages` - AI chat history

### Shared
- `shared/schema.ts` - Drizzle ORM schema definitions

## Development

### Scripts
- `npm run dev` - Start both backend and frontend servers
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned)
- `GEMINI_API_KEY` - Google Gemini API key (stored as secret)

## Recent Changes
- 2026-01-28: Database integration complete with Drizzle ORM
- API endpoints for users, saves, events, and chat messages
- Removed API key modal - uses environment secrets instead
