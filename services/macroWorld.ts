import { MacroEvent, WorldRegion } from '../types';
import { extractCountry } from './simulationMemory';

const MACRO_EVENT_POOL: Array<Omit<MacroEvent, 'date'>> = [
  { headline: 'Global climate volatility intensifies', category: 'CLIMATE', scope: 'global', impactSummary: 'Food prices and health risks rise in vulnerable regions.' },
  { headline: 'AI automation reshapes entry-level work', category: 'TECH', scope: 'global', impactSummary: 'Routine jobs contract while new digital roles emerge.' },
  { headline: 'Regional public health campaign expands', category: 'HEALTH', scope: 'regional', impactSummary: 'Preventive care improves across rural communities.' },
  { headline: 'Economic slowdown tightens household budgets', category: 'ECONOMY', scope: 'global', impactSummary: 'Wages stagnate, informal work grows.' },
  { headline: 'Infrastructure investment boosts mobility', category: 'SOCIAL', scope: 'regional', impactSummary: 'Commutes improve and local commerce grows.' },
  { headline: 'Migration policy shifts', category: 'POLITICS', scope: 'regional', impactSummary: 'Cross-border movement becomes harder or easier.' },
  { headline: 'Conflict escalates in neighboring region', category: 'CONFLICT', scope: 'regional', impactSummary: 'Displacement and uncertainty increase.' }
];

const REGION_HINTS: Record<WorldRegion, string[]> = {
  Africa: ['Sub-Saharan Africa', 'North Africa'],
  Americas: ['North America', 'South America', 'Central America'],
  Asia: ['South Asia', 'East Asia', 'Southeast Asia'],
  Europe: ['Western Europe', 'Eastern Europe'],
  Oceania: ['Pacific Islands', 'Australia/NZ'],
  MiddleEast: ['Levant', 'Gulf', 'Middle East']
};

const hashString = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
};

const seededRandom = (seed: number): () => number => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pickFromPool = (rng: () => number, count: number): Array<Omit<MacroEvent, 'date'>> => {
  const copy = [...MACRO_EVENT_POOL];
  const picks: Array<Omit<MacroEvent, 'date'>> = [];
  for (let i = 0; i < count && copy.length > 0; i += 1) {
    const idx = Math.floor(rng() * copy.length);
    picks.push(copy.splice(idx, 1)[0]);
  }
  return picks;
};

export const getMacroEvents = (params: {
  date: string;
  location: string;
  region?: WorldRegion;
  timeStep: string;
}): MacroEvent[] => {
  const { date, location, region, timeStep } = params;
  const country = extractCountry(location);
  const seed = hashString(`${date}-${location}-${timeStep}`);
  const rng = seededRandom(seed);
  const count = timeStep === 'Year' ? 2 : 1;
  const picks = pickFromPool(rng, count).map((event) => ({
    ...event,
    date
  }));

  const regionHint = region ? REGION_HINTS[region]?.[Math.floor(rng() * REGION_HINTS[region].length)] : undefined;

  return picks.map((event) => {
    if (event.scope === 'regional') {
      const regionName = regionHint || country || 'the region';
      return { ...event, headline: `${event.headline} (${regionName})` };
    }
    return event;
  });
};
