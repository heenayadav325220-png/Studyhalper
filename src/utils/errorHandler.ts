/**
 * ASCEND STUDY - CENTRALIZED ERROR HANDLING SYSTEM
 * 
 * Category-based error handling, user-friendly localized messages,
 * safe diagnostic logging, and proactive failure-to-message mapping.
 */

export type ErrorCategory =
  | 'AUTH_ERROR'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'QUOTA_ERROR'
  | 'FIREBASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'PERMISSION_ERROR'
  | 'FILE_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  category: ErrorCategory;
  message: string;
  messageHindi: string;
  originalError: any;
}

/**
 * Categorizes any error and returns the exact, raw, original error details for full debugging visibility
 */
export function parseError(error: any): AppError {
  let rawErrorMessage = '';
  
  if (error instanceof Error) {
    rawErrorMessage = error.message;
  } else if (error && typeof error === 'object') {
    rawErrorMessage = error.message || error.details || error.statusText || JSON.stringify(error);
  } else {
    rawErrorMessage = String(error || '');
  }

  // Format with error code if present
  if (error?.code) {
    rawErrorMessage = `[${error.code}] ${rawErrorMessage}`;
  } else if (error?.status) {
    rawErrorMessage = `[HTTP ${error.status}] ${rawErrorMessage}`;
  }

  // Fallback if absolutely empty
  if (!rawErrorMessage || rawErrorMessage.trim() === '' || rawErrorMessage === '{}') {
    rawErrorMessage = 'Unknown internal system error occurred.';
  }

  const errStr = rawErrorMessage.toLowerCase();
  const errCode = String(error?.code || '').toLowerCase();

  let category: ErrorCategory = 'UNKNOWN_ERROR';

  // Still categorize the error for logging/telemetry, but preserve the exact raw text for the user
  if (
    errStr.includes('network') ||
    errStr.includes('offline') ||
    errStr.includes('failed to fetch') ||
    errStr.includes('load failed') ||
    errStr.includes('connection') ||
    errStr.includes('internet')
  ) {
    category = 'NETWORK_ERROR';
  } else if (
    errCode.includes('auth/') ||
    errStr.includes('auth/') ||
    errStr.includes('password') ||
    errStr.includes('sign-in') ||
    errStr.includes('credential') ||
    errStr.includes('unauthorized') ||
    errStr.includes('login')
  ) {
    category = 'AUTH_ERROR';
  } else if (
    errStr.includes('quota') ||
    errStr.includes('limit exceeded') ||
    errStr.includes('exhausted') ||
    errCode === 'resource_exhausted' ||
    errStr.includes('too many requests') ||
    errStr.includes('429')
  ) {
    category = 'QUOTA_ERROR';
  } else if (
    errStr.includes('timeout') ||
    errStr.includes('timed out') ||
    errStr.includes('deadline-exceeded')
  ) {
    category = 'TIMEOUT_ERROR';
  } else if (
    errStr.includes('permission-denied') ||
    errStr.includes('insufficient permissions') ||
    errStr.includes('unauthorized-domain')
  ) {
    category = 'PERMISSION_ERROR';
  } else if (
    errStr.includes('firestore') ||
    errStr.includes('firebase') ||
    errStr.includes('snapshot') ||
    errStr.includes('storage/')
  ) {
    category = 'FIREBASE_ERROR';
  } else if (
    errStr.includes('invalid') ||
    errStr.includes('required') ||
    errStr.includes('validation') ||
    errStr.includes('type') ||
    errStr.includes('size')
  ) {
    category = 'VALIDATION_ERROR';
  }

  return {
    category,
    message: rawErrorMessage,
    messageHindi: rawErrorMessage,
    originalError: error,
  };
}

/**
 * Safe logger for diagnostics
 */
export function logError(error: any, context: string): void {
  // Never log passwords, keys or secrets
  const sanitizedMsg = String(error?.message || error || '')
    .replace(/api[-_]?key=[a-zA-Z0-9_\-]+/gi, 'api_key=***')
    .replace(/password=[a-zA-Z0-9_\-]+/gi, 'password=***')
    .replace(/token=[a-zA-Z0-9_\.\-]+/gi, 'token=***');

  const category = parseError(error).category;

  if (import.meta.env.DEV) {
    console.error(`[DIAGNOSTICS] Error in context: ${context} | Category: ${category}`, {
      message: sanitizedMsg,
      original: error,
    });
  } else {
    // Production level minimized reporting
    console.error(`[SYSTEM_ERROR] [${category}] [${context}]`);
  }
}

/**
 * High-performance safe JSON parser helper to prevent crash
 */
export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    return fallback;
  }
}
