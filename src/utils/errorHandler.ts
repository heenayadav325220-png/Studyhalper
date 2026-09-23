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
 * Categorizes any error and returns user-friendly messages
 */
export function parseError(error: any): AppError {
  const errStr = String(error?.message || error || '').toLowerCase();
  const errCode = String(error?.code || '').toLowerCase();

  let category: ErrorCategory = 'UNKNOWN_ERROR';
  let message = 'Something went wrong. Please try again.';
  let messageHindi = 'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।';

  // 1. Network / Offline Errors
  if (
    errStr.includes('network') ||
    errStr.includes('offline') ||
    errStr.includes('failed to fetch') ||
    errStr.includes('load failed') ||
    errStr.includes('connection') ||
    errStr.includes('internet')
  ) {
    category = 'NETWORK_ERROR';
    message = "You're offline or the connection is unstable. Please check your internet connection and try again.";
    messageHindi = 'आप ऑफ़लाइन हैं या कनेक्शन अस्थिर है। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।';
  }
  // 2. Auth / Authentication Errors
  else if (
    errCode.includes('auth/') ||
    errStr.includes('auth/') ||
    errStr.includes('password') ||
    errStr.includes('sign-in') ||
    errStr.includes('credential') ||
    errStr.includes('unauthorized') ||
    errStr.includes('login')
  ) {
    category = 'AUTH_ERROR';
    if (errCode.includes('user-not-found') || errCode.includes('wrong-password') || errCode.includes('invalid-credential') || errStr.includes('invalid-credential')) {
      message = "We couldn't sign you in. Please verify your credentials and try again.";
      messageHindi = 'हम आपको साइन इन नहीं कर सके। कृपया अपने क्रेडेंशियल्स सत्यापित करें और पुनः प्रयास करें।';
    } else if (errCode.includes('email-already-in-use')) {
      message = 'This email is already registered. Please sign in instead.';
      messageHindi = 'यह ईमेल पहले से पंजीकृत है। कृपया साइन इन करें।';
    } else {
      message = "We couldn't sign you in. Please verify your credentials and try again.";
      messageHindi = 'हम आपको साइन इन नहीं कर सके। कृपया अपने क्रेडेंशियल्स सत्यापित करें और पुनः प्रयास करें।';
    }
  }
  // 3. Quota and Rate Limit Errors
  else if (
    errStr.includes('quota') ||
    errStr.includes('limit exceeded') ||
    errStr.includes('exhausted') ||
    errCode === 'resource_exhausted' ||
    errStr.includes('too many requests') ||
    errStr.includes('429')
  ) {
    if (errStr.includes('quota') || errStr.includes('limit')) {
      category = 'QUOTA_ERROR';
      message = 'This AI feature has temporarily reached its usage limit. Please try again later.';
      messageHindi = 'इस AI फीचर की सीमा अस्थायी रूप से समाप्त हो गई है। कृपया बाद में पुनः प्रयास करें।';
    } else {
      category = 'RATE_LIMIT_ERROR';
      message = 'AI service is temporarily busy. Please try again in a moment.';
      messageHindi = 'AI सेवा अस्थायी रूप से व्यस्त है। कृपया कुछ ही पलों में पुनः प्रयास करें।';
    }
  }
  // 4. Timeout Errors
  else if (
    errStr.includes('timeout') ||
    errStr.includes('timed out') ||
    errStr.includes('deadline-exceeded')
  ) {
    category = 'TIMEOUT_ERROR';
    message = 'The request took too long. Please try again.';
    messageHindi = 'अनुरोध में बहुत समय लगा। कृपया पुनः प्रयास करें।';
  }
  // 5. Firebase / Firestore Permission Errors
  else if (
    errStr.includes('permission-denied') ||
    errStr.includes('insufficient permissions') ||
    errStr.includes('unauthorized-domain')
  ) {
    category = 'PERMISSION_ERROR';
    message = "You don't have permission to perform this action.";
    messageHindi = 'आपको इस क्रिया को करने की अनुमति नहीं है।';
  }
  // 6. Firebase / Firestore Errors
  else if (
    errStr.includes('firestore') ||
    errStr.includes('firebase') ||
    errStr.includes('snapshot') ||
    errStr.includes('storage/')
  ) {
    category = 'FIREBASE_ERROR';
    message = 'Database sync issue. Your progress is saved locally and will sync soon.';
    messageHindi = 'डेटाबेस सिंक समस्या। आपकी प्रगति स्थानीय रूप से सहेजी गई है और जल्द ही सिंक हो जाएगी।';
  }
  // 7. Validation / File Errors
  else if (
    errStr.includes('invalid') ||
    errStr.includes('required') ||
    errStr.includes('validation') ||
    errStr.includes('type') ||
    errStr.includes('size')
  ) {
    category = 'VALIDATION_ERROR';
    message = 'Please check the entered values and try again.';
    messageHindi = 'कृपया दर्ज किए गए मानों की जाँच करें और पुनः प्रयास करें।';
  }

  return {
    category,
    message,
    messageHindi,
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
