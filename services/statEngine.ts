import { CharacterAttributes, TimeStep } from '../types';
import { logDebug } from './logger';

const STAT_KEYS: Array<keyof CharacterAttributes> = [
  'health',
  'happiness',
  'intelligence',
  'social',
  'energy'
];

const ensureNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  if (Number.isFinite(num)) return num;
  return fallback;
};

const clampStat = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const clampWealth = (value: number): number => Math.max(0, Math.round(value));

export const normalizeAttributes = (
  attrs: Partial<CharacterAttributes> | undefined,
  fallback: CharacterAttributes
): CharacterAttributes => {
  return {
    health: clampStat(ensureNumber(attrs?.health, fallback.health)),
    happiness: clampStat(ensureNumber(attrs?.happiness, fallback.happiness)),
    personalWealth: clampWealth(ensureNumber(attrs?.personalWealth, fallback.personalWealth)),
    familyWealth: clampWealth(ensureNumber(attrs?.familyWealth, fallback.familyWealth)),
    intelligence: clampStat(ensureNumber(attrs?.intelligence, fallback.intelligence)),
    social: clampStat(ensureNumber(attrs?.social, fallback.social)),
    energy: clampStat(ensureNumber(attrs?.energy, fallback.energy))
  };
};

const timeMultiplier = (step: TimeStep): number => {
  switch (step) {
    case 'Day':
      return 0.4;
    case 'Week':
      return 0.8;
    case 'Month':
      return 1.3;
    case 'Year':
      return 2.6;
    default:
      return 1;
  }
};

const eventBaseline = (eventType: string | undefined): { happiness: number; health: number; energy: number } => {
  switch (eventType) {
    case 'positive':
      return { happiness: 2, health: 1, energy: 1 };
    case 'negative':
      return { happiness: -2, health: -1, energy: -1 };
    case 'major':
      return { happiness: 3, health: 2, energy: 2 };
    case 'neutral':
    default:
      return { happiness: 0, health: 0, energy: 0 };
  }
};

const keywordRules = [
  { regex: /(study|read|learn|school|college|class|exam)/i, delta: { intelligence: 2, happiness: 0.5 } },
  { regex: /(exercise|workout|gym|run|train|sport)/i, delta: { health: 2, energy: -1, happiness: 1 } },
  { regex: /(sleep|rest|nap|relax|meditate)/i, delta: { energy: 3, happiness: 1 } },
  { regex: /(work|job|shift|overtime|labor)/i, delta: { personalWealth: 3, energy: -2, happiness: -1 } },
  { regex: /(save|budget|invest|deposit)/i, delta: { personalWealth: 2 } },
  { regex: /(buy|spend|gamble|bet|loan|debt)/i, delta: { personalWealth: -2 } },
  { regex: /(social|friend|party|talk|network|community)/i, delta: { social: 2, happiness: 1 } },
  { regex: /(argue|fight|violence|crime|steal)/i, delta: { health: -2, happiness: -2, social: -1 } },
  { regex: /(smoke|drink|drug|overdose)/i, delta: { health: -2, happiness: 1, energy: -1 } }
];

const applyDelta = (
  attrs: CharacterAttributes,
  delta: Partial<CharacterAttributes>,
  scale: number
): CharacterAttributes => {
  const next = { ...attrs };
  if (delta.health) next.health += delta.health * scale;
  if (delta.happiness) next.happiness += delta.happiness * scale;
  if (delta.energy) next.energy += delta.energy * scale;
  if (delta.intelligence) next.intelligence += delta.intelligence * scale;
  if (delta.social) next.social += delta.social * scale;
  if (delta.personalWealth) next.personalWealth += delta.personalWealth * scale;
  if (delta.familyWealth) next.familyWealth += delta.familyWealth * scale;
  return next;
};

const computeStatDeltaMagnitude = (a: CharacterAttributes, b: CharacterAttributes): number => {
  return STAT_KEYS.reduce((sum, key) => sum + Math.abs(a[key] - b[key]), 0);
};

const summarizeChanges = (before: CharacterAttributes, after: CharacterAttributes): Record<string, number> => {
  const changes: Record<string, number> = {};
  STAT_KEYS.forEach((key) => {
    const diff = Math.round(after[key] - before[key]);
    if (diff !== 0) {
      changes[key] = diff;
    }
  });
  return changes;
};

export const applyStatAdjustments = (params: {
  attributes: CharacterAttributes;
  previousAttributes: CharacterAttributes;
  choiceText?: string | null;
  eventType?: string;
  timeStep: TimeStep;
  description?: string;
}): CharacterAttributes => {
  const { attributes, previousAttributes, choiceText, eventType, timeStep, description } = params;
  const multiplier = timeMultiplier(timeStep);
  const modelDeltaMagnitude = computeStatDeltaMagnitude(previousAttributes, attributes);
  const dampener = modelDeltaMagnitude >= 12 ? 0.35 : modelDeltaMagnitude >= 6 ? 0.6 : 1;

  let next = { ...attributes };
  const baseDelta = eventBaseline(eventType);
  next = applyDelta(next, baseDelta, multiplier * dampener);

  const context = `${choiceText || ''} ${description || ''}`.trim();
  if (context) {
    keywordRules.forEach((rule) => {
      if (rule.regex.test(context)) {
        next = applyDelta(next, rule.delta, multiplier * dampener);
      }
    });
  }

  // Normalize final values
  next = {
    ...next,
    health: clampStat(next.health),
    happiness: clampStat(next.happiness),
    intelligence: clampStat(next.intelligence),
    social: clampStat(next.social),
    energy: clampStat(next.energy),
    personalWealth: clampWealth(next.personalWealth),
    familyWealth: clampWealth(next.familyWealth)
  };

  const changes = summarizeChanges(previousAttributes, next);
  if (Object.keys(changes).length > 0) {
    logDebug('Stat adjustments applied', {
      changes,
      modelDeltaMagnitude,
      dampener,
      timeStep,
      eventType
    });
  }

  return next;
};
