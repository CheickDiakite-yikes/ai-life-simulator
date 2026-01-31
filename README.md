# Simili - AI Life Simulator

Simili is a hyper-realistic AI life simulation game that lets you live thousands of different lives and see how environment, luck, and choice shape a human story. It blends systems modeling with narrative generation to create believable, emotionally grounded experiences from birth to death.

**Live Demo:** https://simili-ai.replit.app

---

## Table of Contents

- [Why Simili Exists](#why-simili-exists)
- [Features](#features)
- [Game Modes](#game-modes)
- [Technical Architecture](#technical-architecture)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Media Generation & Storage](#media-generation--storage)
- [Authentication System](#authentication-system)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Why Simili Exists

Simili is designed for:
- **Players** who want a deep, narrative life sim with meaningful choices
- **Researchers and educators** exploring systemic outcomes and bias
- **Anyone curious** how small decisions compound over time

It is not a prediction engine. It is a synthetic simulation that aims to be honest about context and consequence.

---

## Features

### Core Experience
- **Three game modes**: Real Life (randomized birth), Custom Start (choose name/location), Alternative (fantasy/sci-fi/superhero/horror)
- **Life stages**: Infancy → Childhood → Adolescence → Young Adult → Midlife → Elderhood
- **Time control**: Advance by Day, Week, Month, or Year with consistent date logic
- **Realistic stats**: Health, mental wellness, energy, wealth, intelligence, social connections
- **Hidden mechanics**: Long-term consequences track beneath the surface
- **Narrative arcs**: Mentors, illness, migration, love, injustice, calling, and more

### AI-Powered Multimedia
- **Visualize**: Generate scene images using Google Gemini's image generation
- **Animate**: Create short video clips of life moments
- **Narrate**: Text-to-speech narration of events
- **Oracle Chat**: In-game AI assistant for guidance, lore, and game mechanics

### Persistent Storage
- **Cloud saves**: All game progress saved to PostgreSQL database
- **Media caching**: Generated images, videos, and audio stored permanently in Replit Object Storage
- **Session authentication**: Secure login with email/password

### Coherence and Trust
- **Plausible life logic**: Education, career, and relationships evolve by age and stage
- **Causal threads**: "Why this happened" overlay explains systemic causes
- **Moral friction**: Harmful choices carry realistic consequences
- **Global diversity control**: Birth-region weighting and repetition avoidance

### Depth and Meaning
- **Opportunity systems**: Healthcare access, school quality, safety, labor market, social capital, discrimination, migration policy, housing stability
- **Legacy**: Community reputation, cultural impact, generational wealth
- **Purpose drives**: Belonging, mastery, autonomy, meaning
- **Milestone reveals**: Key life moments are highlighted

### Wonder and Research Value
- **Macro world events**: Climate, conflict, tech, economy, health
- **Parallel Lives Lab**: Compare identical traits across regions
- **Research Mode**: Neutral analysis of systemic vs agency factors (opt-in only)
- **Ethics Dashboard**: Transparency on assumptions and synthetic nature

---

## Game Modes

### Real Life (Random)
Start with no control. Your birthplace, family status, and early conditions are weighted by global distributions. Experience life as it comes.

### Custom Start
Choose your name and birthplace. All other traits are still generated realistically from the context you provide.

### Alternative
Optional genre selection (or random):
- **Fantasy**: Arcane traits, mana, ritual consequences
- **Sci-Fi**: Tech augmentation, anomaly exposure
- **Superhero**: Power tiers, fame, moral stakes
- **Horror**: Dread, omens, survival pressure

Alternative mode keeps grounded consequences while layering genre systems.

### Setup Options (Before Starting)
- **Research Mode (opt-in)**: Adds analysis summaries for each event
- **Birth distribution**: Global, balanced, or custom region weights
- **Realism intensity**: Gentle, true, or harsh
- **Start year (optional)**: Choose a year for birth or leave blank for random
- **Alternative sub-genre (optional)**: Pick or randomize for Alternative mode

---

## Technical Architecture

### Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Vite)                         │
│                     React + TypeScript + GSAP                   │
│                         Port 5000                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express)                          │
│                   REST API + Session Auth                       │
│                         Port 3000                               │
└─────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌────────────────────────┐    ┌────────────────────────────────────┐
│     PostgreSQL         │    │    Replit Object Storage           │
│    (Neon-backed)       │    │    (Media Files)                   │
│  - Users & Sessions    │    │  - Generated Images (.jpg/.png)    │
│  - Game Saves          │    │  - Generated Videos (.mp4)         │
│  - Life Events         │    │  - Generated Audio (.mp3/.wav)     │
│  - Chat Messages       │    └────────────────────────────────────┘
└────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Google Gemini AI                             │
│           Text Generation, Images, Video, Audio                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend**
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 6 | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| GSAP | Landing page animations |
| Lucide React | Icon library |

**Backend**
| Technology | Purpose |
|------------|---------|
| Express 5 | REST API server |
| Drizzle ORM | Database queries |
| bcryptjs | Password hashing |
| CORS | Cross-origin requests |

**Data & AI**
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Relational database (Neon) |
| Replit Object Storage | Binary media storage |
| Google Gemini | AI text, image, video, audio generation |

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Create new account | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/logout` | End session | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

#### Signup Request
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe",
  "source": "google search"
}
```

#### Login Request
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Game Save Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/saves` | List all user saves | Yes |
| GET | `/api/save/:id` | Get specific save | Yes |
| POST | `/api/saves` | Create new save | Yes |
| PUT | `/api/saves/:id` | Update existing save | Yes |
| DELETE | `/api/saves/:id` | Delete save | Yes |

#### Save Object Structure
```json
{
  "id": 1,
  "userId": 1,
  "saveName": "Marcus Chen - Age 25",
  "gameMode": "real",
  "character": { ... },
  "currentEvent": { ... },
  "history": [ ... ],
  "settings": { ... },
  "createdAt": "2026-01-31T00:00:00.000Z",
  "updatedAt": "2026-01-31T12:00:00.000Z"
}
```

### Oracle Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chat/:gameId` | Get chat history for game | Yes |
| POST | `/api/chat` | Send message to Oracle | Yes |

### Media Generation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/generate/image` | Generate scene image | Yes |
| POST | `/api/generate/video` | Generate scene video | Yes |
| POST | `/api/generate/audio` | Generate narration audio | Yes |
| GET | `/api/media/:type/:hash` | Serve cached media file | No |

#### Image Generation Request
```json
{
  "prompt": "A young woman walking through a bustling Tokyo market at sunset",
  "aspectRatio": "16:9",
  "resolution": "2K"
}
```

#### Response
```json
{
  "url": "/api/media/image/abc123def456.png",
  "cached": false
}
```

---

## Database Schema

### Tables

#### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| email | varchar(255) | Unique email address |
| passwordHash | varchar(255) | bcrypt hashed password |
| fullName | varchar(255) | Display name |
| source | varchar(255) | How they found the app |
| createdAt | timestamp | Account creation time |

#### `sessions`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Foreign key to users |
| token | varchar(255) | Session token (UUID) |
| expiresAt | timestamp | Session expiration (30 days) |
| createdAt | timestamp | Session creation time |

#### `game_saves`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Foreign key to users |
| saveName | varchar(255) | Display name for save |
| gameMode | varchar(50) | real, custom, or alternative |
| character | jsonb | Full character state |
| currentEvent | jsonb | Current life event |
| history | jsonb | Array of past events |
| settings | jsonb | Game settings |
| createdAt | timestamp | Save creation time |
| updatedAt | timestamp | Last update time |

#### `life_events`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| saveId | integer | Foreign key to game_saves |
| eventData | jsonb | Event details |
| createdAt | timestamp | Event creation time |

#### `chat_messages`
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| saveId | integer | Foreign key to game_saves |
| role | varchar(50) | user or assistant |
| content | text | Message content |
| createdAt | timestamp | Message creation time |

---

## Media Generation & Storage

### How It Works

1. **Request**: User clicks Visualize/Animate/Narrate button
2. **Hash Check**: Server generates SHA-256 hash of prompt + options
3. **Cache Lookup**: Check if media exists in Object Storage
4. **Generate or Retrieve**:
   - If cached: Return URL immediately (`cached: true`)
   - If new: Call Gemini API, save to Object Storage, return URL
5. **Serve**: Media served via `/api/media/:type/:hash` endpoint

### Storage Keys
```
media/image/{hash}.png   → Scene images
media/video/{hash}.mp4   → Animated clips
media/audio/{hash}.wav   → Narration audio
```

### Content-Type Detection
Media files are served with correct MIME types using magic byte detection:
- JPEG: `ff d8 ff` → `image/jpeg`
- PNG: `89 50 4e 47` → `image/png`
- GIF: `47 49 46` → `image/gif`
- WebP: `52 49 46 46` → `image/webp`

### Benefits
- **Token efficiency**: Same prompt never regenerates
- **Persistence**: Media survives session restarts
- **Fast loads**: Cached media returns instantly
- **Cost savings**: Reduces API calls to Gemini

---

## Authentication System

### Overview
Simili uses session-based authentication with httpOnly cookies for security.

### Flow
1. **Signup**: User provides email, password, name
2. **Password Hash**: bcrypt with 12 rounds
3. **Session Creation**: UUID token stored in database
4. **Cookie**: `simili_session` cookie set (30-day expiration)
5. **Protected Routes**: Middleware validates session token

### Security Features
- **httpOnly cookies**: Prevents XSS access to session token
- **bcrypt hashing**: Industry-standard password protection
- **30-day sessions**: Automatic expiration
- **Secure flag**: Cookies only sent over HTTPS in production

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Gemini API key

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/your-username/simili.git
cd simili
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/simili
```

4. **Initialize database**
```bash
npm run db:push
```

5. **Start development servers**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:5000
```

### Replit Deployment

On Replit, the following are auto-configured:
- `DATABASE_URL` - PostgreSQL connection string
- Object Storage - Media file storage
- Port 5000 - Frontend (public)
- Port 3000 - Backend (internal)

You only need to add:
- `GEMINI_API_KEY` - Add via Secrets tab

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend (port 3000) and frontend (port 5000) |
| `npm run build` | Build frontend for production |
| `npm run start` | Run production server |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio for database management |

### Key Development Notes

1. **Vite Proxy**: Frontend proxies `/api/*` requests to backend on port 3000
2. **Hot Reload**: Both frontend and backend support hot reloading
3. **TypeScript**: Full type coverage across frontend and backend
4. **No localStorage**: All state stored in PostgreSQL (no browser storage)

### Debugging

Enable debug logs in browser console:
```javascript
localStorage.SIMILI_DEBUG = "1"
```

Check server logs for API issues:
```bash
# View workflow logs in Replit
```

---

## Deployment

### Replit Deployment

1. **Secrets**: Add `GEMINI_API_KEY` in the Secrets tab
2. **Database**: Auto-provisioned PostgreSQL
3. **Object Storage**: Auto-configured for media files
4. **Publish**: Click "Publish" button in Replit

### Production Configuration

The app auto-detects production environment:
- CORS configured for production domain
- Cookies use secure flag
- Cache headers optimized for static assets

---

## Project Structure

```
simili/
├── components/              # React components
│   ├── AuthPage.tsx         # Login/signup forms
│   ├── ChatInterface.tsx    # Oracle AI chat
│   ├── Dashboard.tsx        # Main game interface
│   ├── EthicsModal.tsx      # Ethics transparency modal
│   ├── LandingPage.tsx      # Animated landing page
│   ├── MultiLifeComparison.tsx  # Parallel lives feature
│   ├── SavedGamesSection.tsx    # Save/load UI
│   └── SimulationSettings.tsx   # Game settings modal
│
├── services/                # Frontend services
│   ├── geminiService.ts     # Gemini API integration
│   ├── geminiLoader.ts      # API key loading
│   ├── saveGameService.ts   # Save/load API calls
│   ├── altMechanics.ts      # Alternative mode mechanics
│   ├── driveEngine.ts       # Purpose/drive system
│   ├── lifeModel.ts         # Life simulation logic
│   ├── macroWorld.ts        # World events system
│   └── researchAnalysis.ts  # Research mode analysis
│
├── server/                  # Backend server
│   ├── index.ts             # Express API endpoints
│   ├── db.ts                # Drizzle database connection
│   ├── storage.ts           # Database storage layer
│   └── mediaService.ts      # Object Storage media handling
│
├── shared/                  # Shared code
│   └── schema.ts            # Drizzle database schema
│
├── public/                  # Static assets
│   ├── manifest.json        # PWA manifest
│   ├── og-image.png         # Social sharing image
│   ├── robots.txt           # Search engine rules
│   ├── sitemap.xml          # SEO sitemap
│   └── llms.txt             # AI crawler info
│
├── App.tsx                  # Main app component
├── AppWrapper.tsx           # Landing page routing
├── index.css                # Global styles
├── types.ts                 # TypeScript definitions
├── vite.config.ts           # Vite configuration
├── drizzle.config.ts        # Drizzle ORM config
├── package.json             # Dependencies
└── README.md                # This file
```

---

## Contributing

### Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add comments for complex logic
- No hardcoded values - use environment variables

### Reporting Issues

Open a GitHub issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## License

This project is private. Contact the maintainer for licensing inquiries.

---

## Support

- **GitHub Issues**: For bug reports and feature requests
- **Email**: Contact the maintainer directly

---

## Acknowledgments

- Google Gemini for AI capabilities
- Replit for hosting and infrastructure
- The open source community for amazing tools

---

*"Know thyself through infinite lives"*
