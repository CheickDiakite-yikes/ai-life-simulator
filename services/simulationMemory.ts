import { logDebug, logWarn } from './logger';

export interface RecentStart {
  name: string;
  location: string;
  ethnicity?: string;
  bio?: string;
  mode?: string;
  country?: string;
}

const STORAGE_KEY = 'SIMILI_RECENT_STARTS';
const MAX_ENTRIES = 12;

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const MULTIWORD_COUNTRIES = [
  'united states',
  'united kingdom',
  'south africa',
  'north korea',
  'south korea',
  'new zealand',
  'saudi arabia',
  'united arab emirates',
  'dominican republic',
  'czech republic',
  'new caledonia'
];

const readStarts = (): RecentStart[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.location === 'string');
  } catch (error) {
    logWarn('Failed to read recent starts', error);
    return [];
  }
};

const writeStarts = (starts: RecentStart[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(starts));
  } catch (error) {
    logWarn('Failed to write recent starts', error);
  }
};

export const extractCountry = (location: string): string => {
  if (!location) return '';
  const normalized = normalizeText(location);
  if (!normalized) return '';

  for (const candidate of MULTIWORD_COUNTRIES) {
    if (normalized.includes(candidate)) return candidate;
  }

  const parts = location
    .split(/,|\/| - |–|—/g)
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1] || location;
  const lastNormalized = normalizeText(last);
  if (lastNormalized) {
    const tokens = lastNormalized.split(' ');
    if (tokens.length >= 2) {
      return tokens.slice(-2).join(' ');
    }
    return lastNormalized;
  }

  const tokens = normalized.split(' ');
  return tokens.length ? tokens[tokens.length - 1] : normalized;
};

export const summarizeRecentStarts = (starts: RecentStart[]): string => {
  if (!starts.length) return 'None';
  return starts
    .map((start) => {
      const ethnicity = start.ethnicity ? `, ${start.ethnicity}` : '';
      return `${start.name || 'Unknown'} (${start.location}${ethnicity})`;
    })
    .join(' | ');
};

export const buildAvoidCountries = (starts: RecentStart[]): string[] => {
  const countries = new Set<string>();
  starts.forEach((start) => {
    const country = start.country || extractCountry(start.location);
    if (country) countries.add(country);
  });
  return Array.from(countries);
};

export const matchesAvoidedCountry = (location: string, avoidCountries: string[]): boolean => {
  if (!location || avoidCountries.length === 0) return false;
  const normalized = normalizeText(location);
  return avoidCountries.some((country) => normalized.includes(country));
};

export const getRecentStarts = (): RecentStart[] => readStarts();

export const addRecentStart = (start: RecentStart): RecentStart[] => {
  if (!start || !start.location) return getRecentStarts();
  const existing = readStarts();
  const country = start.country || extractCountry(start.location);
  const next: RecentStart[] = [{ ...start, country }, ...existing];

  const seen = new Set<string>();
  const deduped = next.filter((item) => {
    const key = item.country || extractCountry(item.location);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const trimmed = deduped.slice(0, MAX_ENTRIES);
  writeStarts(trimmed);
  logDebug('Stored recent starts', trimmed.map((item) => item.location));
  return trimmed;
};
