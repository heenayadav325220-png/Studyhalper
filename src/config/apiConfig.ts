import { Capacitor } from '@capacitor/core';

/**
 * Returns the correct API base URL:
 * - When running natively on Android/iOS via Capacitor, returns the production backend URL ('https://studyhalper.vercel.app')
 * - When running in a web browser, returns an empty string '' so relative paths work normally.
 */
export const getApiBaseUrl = (): string => {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      return 'https://studyhalper.vercel.app';
    }
  } catch (e) {
    // Ignore in SSR / non-Capacitor environments
  }
  return '';
};

export const API_BASE = getApiBaseUrl();

export const getApiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
