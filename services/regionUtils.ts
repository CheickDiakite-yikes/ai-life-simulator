import { WorldRegion } from '../types';
import { extractCountry } from './simulationMemory';

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const COUNTRY_REGION_MAP: Record<string, WorldRegion> = {
  // Africa
  'nigeria': 'Africa',
  'ethiopia': 'Africa',
  'egypt': 'Africa',
  'south africa': 'Africa',
  'kenya': 'Africa',
  'tanzania': 'Africa',
  'uganda': 'Africa',
  'ghana': 'Africa',
  'morocco': 'Africa',
  'algeria': 'Africa',
  'sudan': 'Africa',
  'south sudan': 'Africa',
  'angola': 'Africa',
  'mozambique': 'Africa',
  'ivory coast': 'Africa',
  'cote d ivoire': 'Africa',
  'senegal': 'Africa',
  'tunisia': 'Africa',

  // Americas
  'united states': 'Americas',
  'usa': 'Americas',
  'us': 'Americas',
  'canada': 'Americas',
  'mexico': 'Americas',
  'brazil': 'Americas',
  'argentina': 'Americas',
  'colombia': 'Americas',
  'peru': 'Americas',
  'chile': 'Americas',
  'venezuela': 'Americas',
  'cuba': 'Americas',
  'haiti': 'Americas',
  'dominican republic': 'Americas',
  'guatemala': 'Americas',
  'bolivia': 'Americas',
  'ecuador': 'Americas',
  'uruguay': 'Americas',
  'paraguay': 'Americas',

  // Asia
  'india': 'Asia',
  'bangladesh': 'Asia',
  'pakistan': 'Asia',
  'nepal': 'Asia',
  'sri lanka': 'Asia',
  'bhutan': 'Asia',
  'china': 'Asia',
  'japan': 'Asia',
  'south korea': 'Asia',
  'north korea': 'Asia',
  'taiwan': 'Asia',
  'hong kong': 'Asia',
  'mongolia': 'Asia',
  'vietnam': 'Asia',
  'thailand': 'Asia',
  'cambodia': 'Asia',
  'laos': 'Asia',
  'myanmar': 'Asia',
  'malaysia': 'Asia',
  'singapore': 'Asia',
  'indonesia': 'Asia',
  'philippines': 'Asia',
  'brunei': 'Asia',
  'timor leste': 'Asia',
  'afghanistan': 'Asia',
  'uzbekistan': 'Asia',
  'kazakhstan': 'Asia',
  'kyrgyzstan': 'Asia',
  'tajikistan': 'Asia',
  'turkmenistan': 'Asia',

  // Europe
  'united kingdom': 'Europe',
  'uk': 'Europe',
  'england': 'Europe',
  'scotland': 'Europe',
  'wales': 'Europe',
  'ireland': 'Europe',
  'france': 'Europe',
  'germany': 'Europe',
  'italy': 'Europe',
  'spain': 'Europe',
  'portugal': 'Europe',
  'netherlands': 'Europe',
  'belgium': 'Europe',
  'sweden': 'Europe',
  'norway': 'Europe',
  'finland': 'Europe',
  'denmark': 'Europe',
  'poland': 'Europe',
  'ukraine': 'Europe',
  'russia': 'Europe',
  'greece': 'Europe',
  'czech republic': 'Europe',
  'austria': 'Europe',
  'switzerland': 'Europe',
  'romania': 'Europe',
  'bulgaria': 'Europe',
  'serbia': 'Europe',

  // Oceania
  'australia': 'Oceania',
  'new zealand': 'Oceania',
  'fiji': 'Oceania',
  'papua new guinea': 'Oceania',
  'samoa': 'Oceania',

  // Middle East
  'saudi arabia': 'MiddleEast',
  'united arab emirates': 'MiddleEast',
  'uae': 'MiddleEast',
  'qatar': 'MiddleEast',
  'kuwait': 'MiddleEast',
  'oman': 'MiddleEast',
  'bahrain': 'MiddleEast',
  'israel': 'MiddleEast',
  'palestine': 'MiddleEast',
  'jordan': 'MiddleEast',
  'lebanon': 'MiddleEast',
  'syria': 'MiddleEast',
  'iraq': 'MiddleEast',
  'iran': 'MiddleEast',
  'yemen': 'MiddleEast',
  'turkey': 'MiddleEast'
};

export const inferRegionFromCountry = (country: string): WorldRegion | null => {
  if (!country) return null;
  const normalized = normalize(country);
  if (!normalized) return null;
  return COUNTRY_REGION_MAP[normalized] || null;
};

export const inferRegionFromLocation = (location: string): WorldRegion | null => {
  const country = extractCountry(location);
  return inferRegionFromCountry(country);
};
