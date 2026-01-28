const PREFIX = '[Aetheria]';

const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('AETHERIA_DEBUG') === '1';
  } catch {
    return false;
  }
};

export const safeStringify = (value: unknown, maxLength: number = 2000): string => {
  try {
    const text = JSON.stringify(value);
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  } catch {
    return String(value);
  }
};

export const logDebug = (...args: unknown[]) => {
  if (isDebugEnabled()) {
    console.debug(PREFIX, ...args);
  }
};

export const logInfo = (...args: unknown[]) => {
  if (isDebugEnabled()) {
    console.info(PREFIX, ...args);
  }
};

export const logWarn = (...args: unknown[]) => {
  console.warn(PREFIX, ...args);
};

export const logError = (...args: unknown[]) => {
  console.error(PREFIX, ...args);
};
