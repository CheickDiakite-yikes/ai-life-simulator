import { BirthWeightingConfig, WorldRegion } from '../types';

export const DEFAULT_WEIGHTS: Record<WorldRegion, number> = {
  Africa: 18,
  Americas: 13,
  Asia: 59,
  Europe: 9,
  Oceania: 1,
  MiddleEast: 4
};

export const BALANCED_WEIGHTS: Record<WorldRegion, number> = {
  Africa: 20,
  Americas: 20,
  Asia: 20,
  Europe: 20,
  Oceania: 10,
  MiddleEast: 10
};

export const BIRTH_WEIGHT_PRESETS: Record<BirthWeightingConfig['mode'], BirthWeightingConfig> = {
  global: {
    mode: 'global',
    weights: { ...DEFAULT_WEIGHTS }
  },
  balanced: {
    mode: 'balanced',
    weights: { ...BALANCED_WEIGHTS }
  },
  custom: {
    mode: 'custom',
    weights: { ...DEFAULT_WEIGHTS }
  }
};

export const normalizeWeights = (weights: Record<WorldRegion, number>): Record<WorldRegion, number> => {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  const normalized: Record<WorldRegion, number> = { ...weights };
  (Object.keys(weights) as WorldRegion[]).forEach((region) => {
    normalized[region] = Math.round((Math.max(0, weights[region]) / total) * 100);
  });
  const diff = 100 - Object.values(normalized).reduce((sum, value) => sum + value, 0);
  if (diff !== 0) {
    normalized.Asia += diff;
  }
  return normalized;
};

export const formatBirthWeights = (weights: Record<WorldRegion, number>): string => {
  return (Object.keys(weights) as WorldRegion[])
    .map((region) => `${region}: ${weights[region]}%`)
    .join(', ');
};

export const getDefaultBirthConfig = (): BirthWeightingConfig => ({
  mode: 'global',
  weights: { ...DEFAULT_WEIGHTS }
});

export const pickWeightedRegion = (
  weights: Record<WorldRegion, number>,
  options?: { avoidRegions?: WorldRegion[]; rng?: () => number }
): WorldRegion => {
  const rng = options?.rng || Math.random;
  const avoidRegions = options?.avoidRegions || [];
  const normalized = normalizeWeights(weights);
  const adjusted: Record<WorldRegion, number> = { ...normalized };

  avoidRegions.forEach((region) => {
    adjusted[region] = Math.max(1, Math.round(adjusted[region] * 0.4));
  });

  const total = Object.values(adjusted).reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) {
    return 'Asia';
  }

  let roll = rng() * total;
  for (const region of Object.keys(adjusted) as WorldRegion[]) {
    roll -= adjusted[region];
    if (roll <= 0) return region;
  }
  return 'Asia';
};
