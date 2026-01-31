import { logDebug, logWarn } from './logger';

const LOCAL_STORAGE_KEY = 'SIMILI_API_KEY';

export const getEnvApiKey = (): string => {
  // Server-side: check process.env first
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  
  // Client-side: check Vite environment variables
  try {
    const meta = import.meta as any;
    const envKey = (meta.env?.VITE_GEMINI_API_KEY || meta.env?.VITE_API_KEY) as string | undefined;
    if (envKey && envKey !== 'undefined' && envKey !== 'null') return envKey;
  } catch {
    // import.meta.env may not exist in all environments
  }
  
  return '';
};

export const getStoredApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(LOCAL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const setStoredApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, key);
    logDebug('Stored API key locally');
  } catch (error) {
    logWarn('Failed to store API key', error);
  }
};

export const clearStoredApiKey = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    logDebug('Cleared stored API key');
  } catch (error) {
    logWarn('Failed to clear stored API key', error);
  }
};

export const isProbablyValidKey = (key: string): boolean => {
  if (!key) return false;
  return key.length >= 20;
};

export const getRuntimeApiKey = (): string => {
  const envKey = getEnvApiKey();
  if (envKey) return envKey;

  if (typeof window !== 'undefined') {
    const aistudio = (window as any).aistudio;
    try {
      const selected = aistudio?.getSelectedApiKey?.();
      if (selected) return selected;
    } catch (error) {
      logWarn('aistudio.getSelectedApiKey failed', error);
    }
  }

  return getStoredApiKey();
};

export const hasUsableKey = (): boolean => {
  return !!getRuntimeApiKey();
};
