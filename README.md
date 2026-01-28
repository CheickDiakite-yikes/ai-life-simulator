# Simili - AI Life Simulator

An AI-powered hyper-realistic life simulator using React, TypeScript, and Vite, integrated with Google Gemini AI for generating characters, life events, and multimedia content.

## Features

- **Three Game Modes**: Real Life (random), Custom Start, and Alternative (fantasy/supernatural)
- **AI-Generated Characters**: Unique backstories, locations, and circumstances
- **Dynamic Life Events**: Choices that shape your character's destiny
- **Multimedia Generation**: AI-generated images, videos, and audio narration
- **Persistent Saves**: PostgreSQL-backed save system with session authentication
- **Oracle Chat**: AI assistant for guidance and questions about your journey

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js API server
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Google Gemini API (text, images, video, audio)
- **Styling**: Tailwind CSS + GSAP animations
- **Authentication**: Session-based with httpOnly cookies

---

## Local Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- Google Gemini API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd simili
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Required
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL=postgresql://user:password@localhost:5432/simili
   
   # Optional (defaults shown)
   PORT=3000
   VITE_PORT=5000
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   This starts both the backend (port 3000) and frontend (port 5000).

6. **Open in browser**
   
   Navigate to `http://localhost:5000`

---

## Project Structure

```
simili/
├── components/           # React components
│   ├── LandingPage.tsx   # Animated landing page with GSAP
│   ├── AuthPage.tsx      # Login/signup forms
│   ├── Dashboard.tsx     # Main game interface
│   ├── ChatInterface.tsx # Oracle AI chat
│   └── SavedGamesSection.tsx
├── services/             # Frontend services
│   ├── geminiLoader.ts   # AI integration
│   ├── saveGameService.ts # Save/load API calls
│   └── logger.ts         # Debug logging
├── server/               # Backend
│   ├── index.ts          # Express API endpoints
│   ├── db.ts             # Database connection
│   └── storage.ts        # Data access layer
├── shared/               # Shared code
│   └── schema.ts         # Drizzle database schema
├── types.ts              # TypeScript types
├── App.tsx               # Main app component
├── AppWrapper.tsx        # Routing wrapper
└── main.tsx              # Entry point
```

---

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test locally (see below)
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Keep components focused and modular
- Use meaningful variable and function names
- Avoid adding comments unless explaining complex logic

### Testing Your Changes

Before submitting a PR:

1. **Run the dev server** and verify no console errors
2. **Test the user flow**:
   - Landing page animations work
   - Login/signup functions correctly
   - Game modes initialize properly
   - Saves persist and load correctly
   - Navigation (LIFESIM title click) works
3. **Check mobile responsiveness**
4. **Verify database changes** with `npm run db:push`

### Database Changes

If you modify `shared/schema.ts`:

1. **Never change existing ID column types** - this breaks migrations
2. Run `npm run db:push` to sync schema
3. If conflicts occur, use `npm run db:push --force` (development only)
4. Test that existing saves still load properly

---

## Replit Environment Notes

This project is designed to run on Replit. If you're developing locally but the app runs on Replit in production:

### Important Considerations

1. **Port Configuration**
   - Frontend MUST bind to `0.0.0.0:5000` for Replit's proxy
   - Backend runs on port 3000 (internal)
   - Vite config allows all hosts for iframe embedding

2. **Environment Variables**
   - On Replit: Use Secrets tab for `GEMINI_API_KEY`
   - `DATABASE_URL` is auto-provisioned on Replit
   - Never commit secrets to the repository

3. **Database**
   - Replit uses Neon PostgreSQL
   - Local dev can use any PostgreSQL instance
   - Schema is managed via Drizzle ORM

4. **No Docker/Containers**
   - Replit uses Nix, not Docker
   - Don't add Dockerfiles or containerization
   - Dependencies managed via `package.json` and Nix

5. **File Structure**
   - Keep `replit.md` updated with architecture changes
   - Don't modify `.replit` or `replit.nix` unless necessary

### What NOT to Change

- Vite host/port configuration in `vite.config.ts`
- Session cookie settings in `server/index.ts`
- Database connection handling in `server/db.ts`
- The `npm run dev` script structure

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend servers |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio for database inspection |

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Game Saves (authenticated)
- `GET /api/saves` - List user's saves
- `GET /api/save/:id` - Get specific save
- `POST /api/saves` - Create new save
- `PUT /api/saves/:id` - Update save
- `DELETE /api/saves/:id` - Delete save

---

## License

[Add your license here]

---

## Support

For questions or issues:
- Open a GitHub issue
- Check existing issues for solutions
