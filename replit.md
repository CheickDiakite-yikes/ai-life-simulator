# Simili - AI Life Simulator

## Overview
Simili is an AI-powered hyper-realistic life simulator using React, TypeScript, and Vite, integrated with Google Gemini AI for generating characters, life events, and multimedia content.

## Current State
- Frontend running on port 5000 (Vite + React)
- Backend API running on port 3000 (Express)
- PostgreSQL database for persistence
- Session-based authentication with email/password signup and login
- Gemini AI integration using GEMINI_API_KEY environment secret
- All data stored in PostgreSQL - NO localStorage or browser storage
- Enhanced SEO with meta tags, Open Graph, and structured data
- Beautiful animated landing page with GSAP scrollytelling

## Architecture

### Frontend (React + Vite)
- `AppWrapper.tsx` - Entry point handling landing page vs app routing
- `App.tsx` - Main application with authentication state and game management
- `components/LandingPage.tsx` - Animated landing page with GSAP scrollytelling
- `components/AuthPage.tsx` - Email/password signup and login form
- `components/Dashboard.tsx` - Main game interface
- `components/SavedGamesSection.tsx` - Display and load saved games
- `components/ChatInterface.tsx` - AI chat interface (Oracle of Simili)
- `services/saveGameService.ts` - Game save/load API calls (uses session cookies)
- `services/geminiLoader.ts` - Gemini AI integration
- `types.ts` - TypeScript type definitions

### Backend (Express)
- `server/index.ts` - Express API endpoints with session authentication
- `server/db.ts` - Drizzle database connection
- `server/storage.ts` - Database storage layer with IStorage interface

### Authentication
- Session-based using httpOnly cookies (30-day expiration)
- Password hashing with bcryptjs (12 rounds)
- All protected routes require valid session token
- User signup includes: email, password, full name, optional "how did you find us"
- Session cookie name: `simili_session`

### Database Schema (shared/schema.ts)
- `users` - User profiles (email, passwordHash, fullName, source)
- `sessions` - Session tokens with expiration
- `game_saves` - Game state saves with character data, history, and current event
- `life_events` - Historical life events for each save
- `chat_messages` - AI chat history

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Game Saves (all require authentication)
- `GET /api/saves` - Get user's saved games
- `GET /api/save/:id` - Get specific save
- `POST /api/saves` - Create new save
- `PUT /api/saves/:id` - Update save
- `DELETE /api/saves/:id` - Delete save

## SEO Features
- Comprehensive meta tags (description, keywords, robots)
- Open Graph meta tags for social sharing
- Twitter Card meta tags
- JSON-LD structured data (WebApplication schema)
- Canonical URL
- Mobile web app meta tags

## Development

### Scripts
- `npm run dev` - Start both backend and frontend servers
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned)
- `GEMINI_API_KEY` - Google Gemini API key (stored as secret)

## Recent Changes
- 2026-01-28: Enhanced hero section with space-themed background animations
  - Shooting stars with glowing trails that streak across the sky
  - Orbiting satellites that circle around the hero section
  - Spacecraft/UFOs that drift across the background
  - Twinkling stars scattered throughout the hero section
  - All space animations respect reduced motion preferences
- 2026-01-28: Added beautiful animated landing page
  - GSAP-powered scroll animations and parallax effects
  - Classical Greek/Roman themed design with columns, laurels, statues
  - Five scrollytelling sections: hero, philosophy, three fates, testimonials, CTA
  - Floating particles and orbs with ambient animations
  - URL hash-based navigation (no browser storage)
- 2026-01-28: Renamed app from Aetheria to Simili
  - Updated all UI text and branding
  - Enhanced SEO with comprehensive meta tags
  - Added Open Graph and Twitter Card tags
  - Added JSON-LD structured data
  - Updated session cookie name
  - Updated AI system prompts
- 2026-01-28: Full authentication system implemented
  - Email/password signup and login (NO Replit Auth)
  - Session-based authentication with httpOnly cookies
  - Removed all localStorage usage - PostgreSQL only
  - AuthPage component with signup/login forms
  - Logout button on game selection screen
  - All save/load operations require authenticated session
  - Vite proxy configured to forward /api requests to backend
- 2026-01-28: Database integration complete with Drizzle ORM
- 2026-01-28: Full save/load game system with history persistence
