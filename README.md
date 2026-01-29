# Simili - AI Life Simulator

Simili is a hyper-realistic AI life simulation game that lets you live thousands of different lives and see how environment, luck, and choice shape a human story. It blends systems modeling with narrative generation to create believable, emotionally grounded experiences from birth to death.

Live demo: https://simili-ai.replit.app

---

## Why Simili Exists

Simili is designed for:
- Players who want a deep, narrative life sim with meaningful choices
- Researchers and educators exploring systemic outcomes and bias
- Anyone curious how small decisions compound over time

It is not a prediction engine. It is a synthetic simulation that aims to be honest about context and consequence.

---

## Highlights

### Core Experience
- **Three modes**: Real Life (randomized), Custom Start, Alternative (fantasy/scifi/superhero/horror).
- **Life stages**: Infancy -> Childhood -> Adolescence -> Young Adult -> Midlife -> Elderhood.
- **Time control**: Advance by Day, Week, Month, or Year with consistent date logic.
- **Realistic stats**: Health, mental, energy, wealth, intelligence, social.
- **Hidden mechanics**: Long-term consequences track beneath the surface.
- **Narrative arcs**: Mentors, illness, migration, love, injustice, calling, and more.
- **Multimedia**: Optional AI-generated images, video, and narration.
- **Oracle chat**: In-game AI assistant for guidance and mechanics.
- **Persistent saves**: Authenticated save/load system.

### Coherence and Trust
- **Plausible life logic**: Education, career, and relationships evolve by age and stage.
- **Causal threads**: "Why this happened" overlay explains systemic causes.
- **Moral friction**: Harmful choices carry realistic consequences.
- **Global diversity control**: Birth-region weighting and repetition avoidance.

### Depth and Meaning
- **Opportunity systems**: Healthcare access, school quality, safety, labor market, social capital, discrimination, migration policy, housing stability.
- **Legacy**: Community reputation, cultural impact, generational wealth.
- **Purpose drives**: Belonging, mastery, autonomy, meaning.
- **Milestone reveals**: Key life moments are highlighted.

### Wonder and Research Value
- **Macro world events**: Climate, conflict, tech, economy, health.
- **Parallel Lives Lab**: Compare identical traits across regions.
- **Research Mode**: Neutral analysis of systemic vs agency factors (opt-in only).
- **Ethics Dashboard**: Transparency on assumptions and synthetic nature.

---

## Game Modes

### Real Life (Random)
Start with no control. Your birthplace, family status, and early conditions are weighted by global distributions.

### Custom Start
Choose your name and birthplace. All other traits are still generated realistically from the context.

### Alternative
Optional genre selection (or random):
- **Fantasy**: Arcane traits, mana, ritual consequences.
- **Sci-Fi**: Tech augmentation, anomaly exposure.
- **Superhero**: Power tiers, fame, moral stakes.
- **Horror**: Dread, omens, survival pressure.

Alternative mode keeps grounded consequences while layering genre systems.

---

## Setup Options (Before Starting)

- **Research Mode (opt-in)**: When enabled in setup, a Research toggle appears in-game. It adds analysis summaries for each event.
- **Birth distribution**: Global, balanced, or custom region weights.
- **Realism intensity**: Gentle, true, or harsh.
- **Start year (optional)**: Choose a year for birth or leave blank for random.
- **Alternative sub-genre (optional)**: Pick or randomize for Alternative mode.

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- PostgreSQL
- Google Gemini API key

### Install
```bash
npm install
```

### Environment
Create `.env.local`:
```env
GEMINI_API_KEY=your_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/simili
PORT=3000
VITE_PORT=5000
```

### Database
```bash
npm run db:push
```

### Dev Server
```bash
npm run dev
```
Open `http://localhost:5000`

---

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite 6
- Tailwind CSS + custom styles
- GSAP (landing animations)

**Backend**
- Express 5
- PostgreSQL + Drizzle ORM
- Session auth (httpOnly cookies)

**AI**
- Google Gemini (text, image, video, audio)

---

## Key Systems (Under the Hood)

### Simulation Core
- Date math for Day/Week/Month/Year steps
- Age normalization based on birthday
- Coherence checks for education/career/relationships

### Causality and Research
- Systemic factors (healthcare, school, safety, discrimination, etc.)
- Counterfactuals (what could have changed the outcome)
- Optional research summaries with agency notes

### Diversity and Distribution
- Region-weighted births
- Avoids repeating countries across recent starts
- Parallel lives compare same traits across different regions

---

## Project Structure (Top Level)

```
components/
  AuthPage.tsx
  Dashboard.tsx
  EthicsModal.tsx
  MultiLifeComparison.tsx
  SimulationSettings.tsx
  ...
services/
  geminiService.ts
  altMechanics.ts
  driveEngine.ts
  lifeModel.ts
  macroWorld.ts
  researchAnalysis.ts
  ...
server/
  index.ts
  db.ts
  storage.ts
shared/
  schema.ts
types.ts
App.tsx
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + Vite dev server |
| `npm run build` | Build frontend |
| `npm run start` | Run production server |
| `npm run db:push` | Sync schema to DB |
| `npm run db:studio` | Drizzle Studio |

---

## Developer Tips

- Enable debug logs in the browser console by setting `localStorage.SIMILI_DEBUG = "1"`.
- If your build fails on `gsap`, run `npm install` to ensure dependencies are installed.

---

## Notes on Research Mode

- Research is **opt-in at setup**.
- If you do not opt in, the Research toggle is hidden in-game.
- Opt-in adds neutral summaries and systemic vs agency analysis.

---

## Production

Live demo: https://simili-ai.replit.app

Replit details:
- Frontend: port 5000
- Backend: port 3000 (internal)
- GEMINI_API_KEY via Secrets
- DATABASE_URL auto-provisioned

---

## Support

Questions or issues: open a GitHub issue or contact the maintainer.
