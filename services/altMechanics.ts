import { AltGenre, Character, LifeEvent, RealismIntensity, TimeStep } from '../types';
import { logDebug } from './logger';

export const ALT_GENRES: AltGenre[] = ['fantasy', 'scifi', 'superhero', 'horror'];

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const timeMultiplier = (step: TimeStep): number => {
  switch (step) {
    case 'Day':
      return 0.4;
    case 'Week':
      return 0.7;
    case 'Month':
      return 1.0;
    case 'Year':
      return 1.6;
    default:
      return 1;
  }
};

const intensityMultiplier = (intensity?: RealismIntensity): number => {
  if (intensity === 'gentle') return 0.8;
  if (intensity === 'harsh') return 1.2;
  return 1;
};

const GENRE_DEFAULTS: Record<
  AltGenre,
  { statusEffects: string[]; metrics: Record<string, number>; starterItem?: string }
> = {
  fantasy: {
    statusEffects: ['Arcane Affinity'],
    metrics: { mana: 30, curse_risk: 10 },
    starterItem: 'Mysterious token'
  },
  scifi: {
    statusEffects: ['Tech-Augmented'],
    metrics: { tech_sync: 30, anomaly_exposure: 10 },
    starterItem: 'Prototype implant'
  },
  superhero: {
    statusEffects: ['Latent Power'],
    metrics: { power_tier: 40, heroic_fame: 10 },
    starterItem: 'Symbolic crest'
  },
  horror: {
    statusEffects: ['Haunted'],
    metrics: { dread: 35, omen: 15 },
    starterItem: 'Torn journal page'
  }
};

export const pickAltGenre = (rng: () => number = Math.random): AltGenre => {
  const idx = Math.floor(rng() * ALT_GENRES.length);
  return ALT_GENRES[idx] || 'fantasy';
};

export const ensureAlternativeProfile = (character: Character, preferred?: AltGenre): Character => {
  const genre = preferred || character.altGenre || pickAltGenre();
  const defaults = GENRE_DEFAULTS[genre];
  const next: Character = {
    ...character,
    altGenre: genre,
    statusEffects: Array.from(new Set([...(character.statusEffects || []), ...defaults.statusEffects])),
    hiddenMetrics: { ...(character.hiddenMetrics || {}) }
  };

  Object.entries(defaults.metrics).forEach(([key, value]) => {
    if (typeof next.hiddenMetrics[key] !== 'number') {
      next.hiddenMetrics[key] = value;
    }
  });

  if (!next.inventory || next.inventory.length === 0) {
    next.inventory = defaults.starterItem ? [defaults.starterItem] : [];
  }

  return next;
};

export const applyAlternativeMechanics = (params: {
  character: Character;
  event: LifeEvent;
  choiceText?: string | null;
  timeStep: TimeStep;
  realismIntensity?: RealismIntensity;
}): Character => {
  const { character, event, choiceText, timeStep, realismIntensity } = params;
  const next = ensureAlternativeProfile(character, character.altGenre);
  const genre = next.altGenre || 'fantasy';
  const metrics = { ...(next.hiddenMetrics || {}) };
  const context = `${event.description || ''} ${choiceText || ''}`.toLowerCase();
  const multiplier = timeMultiplier(timeStep) * intensityMultiplier(realismIntensity);

  switch (genre) {
    case 'fantasy':
      if (/(spell|ritual|magic|charm|rune|mana)/i.test(context)) {
        metrics.mana = clamp((metrics.mana || 0) + 4 * multiplier);
        next.attributes.energy = clamp(next.attributes.energy + 1 * multiplier);
      }
      if (/(curse|hex|omen|shadow|portal)/i.test(context)) {
        metrics.curse_risk = clamp((metrics.curse_risk || 0) + 3 * multiplier);
        next.attributes.happiness = clamp(next.attributes.happiness - 1 * multiplier);
      }
      break;
    case 'scifi':
      if (/(implant|augment|ai|android|cyber|upgrade|drone)/i.test(context)) {
        metrics.tech_sync = clamp((metrics.tech_sync || 0) + 4 * multiplier);
        next.attributes.intelligence = clamp(next.attributes.intelligence + 1 * multiplier);
      }
      if (/(anomaly|breach|signal|radiation|glitch)/i.test(context)) {
        metrics.anomaly_exposure = clamp((metrics.anomaly_exposure || 0) + 3 * multiplier);
        next.attributes.energy = clamp(next.attributes.energy - 1 * multiplier);
      }
      break;
    case 'superhero':
      if (/(rescue|save|protect|hero|justice)/i.test(context)) {
        metrics.heroic_fame = clamp((metrics.heroic_fame || 0) + 4 * multiplier);
        next.attributes.happiness = clamp(next.attributes.happiness + 1 * multiplier);
      }
      if (/(battle|fight|power|villain|combat)/i.test(context)) {
        metrics.power_tier = clamp((metrics.power_tier || 0) + 3 * multiplier);
        next.attributes.health = clamp(next.attributes.health - 1 * multiplier);
      }
      break;
    case 'horror':
      if (/(nightmare|ghost|whisper|haunt|dread|terror)/i.test(context)) {
        metrics.dread = clamp((metrics.dread || 0) + 4 * multiplier);
        next.attributes.happiness = clamp(next.attributes.happiness - 2 * multiplier);
      }
      if (/(confront|ritual|protect|survive|escape)/i.test(context)) {
        metrics.dread = clamp((metrics.dread || 0) - 2 * multiplier);
        next.attributes.energy = clamp(next.attributes.energy - 1 * multiplier);
      }
      break;
    default:
      break;
  }

  next.hiddenMetrics = metrics;
  logDebug('Applied alternative mechanics', { genre, metrics });
  return next;
};
