import { logDebug, logWarn } from './logger';

export interface RecentStart {
  name: string;
  location: string;
  ethnicity?: string;
  bio?: string;
  mode?: string;
}

const STORAGE_KEY = 'AETHERIA_RECENT_STARTS';
const MAX_ENTRIES = 5;

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
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  const last = parts[parts.length - 1] || location;
  return last.toLowerCase();
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
    const country = extractCountry(start.location);
    if (country) countries.add(country);
  });
  return Array.from(countries);
};

export const getRecentStarts = (): RecentStart[] => readStarts();

export const addRecentStart = (start: RecentStart): RecentStart[] => {
  if (!start || !start.location) return getRecentStarts();
  const existing = readStarts();
  const next: RecentStart[] = [start, ...existing];

  const seen = new Set<string>();
  const deduped = next.filter((item) => {
    const key = `${extractCountry(item.location)}|${item.name?.toLowerCase() || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const trimmed = deduped.slice(0, MAX_ENTRIES);
  writeStarts(trimmed);
  logDebug('Stored recent starts', trimmed.map((item) => item.location));
  return trimmed;
};
