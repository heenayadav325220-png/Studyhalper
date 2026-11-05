import { getAnalytics, logEvent, setUserId, setUserProperties, Analytics } from "firebase/analytics";
import { app } from "../services/firebase";

let analytics: Analytics | undefined;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Firebase Analytics initialization skipped or failed:", e);
  }
}

// Automatically sync route changes / active tabs to GA4 & Firebase
export const trackPageView = (pageName: string, pagePath = typeof window !== "undefined" ? window.location.pathname : "") => {
  if (!analytics) return;
  logEvent(analytics, 'page_view', {
    page_title: pageName,
    page_path: pagePath,
    page_location: typeof window !== "undefined" ? window.location.href : ""
  });
};

// Unified custom feature tracking (Enterprise schema)
export const trackFeatureUse = (featureName: string, action: string, extraData: Record<string, any> = {}) => {
  if (!analytics) return;
  logEvent(analytics, 'feature_interaction', {
    feature_name: featureName, // e.g., 'ai_tutor', 'flashcards', 'planner'
    action_type: action,       // e.g., 'send_query', 'create_card', 'generate_quiz'
    timestamp: new Date().toISOString(),
    ...extraData
  });
};

// Track AI query specifics (Without leaking personal data)
export const trackAIInteraction = (modelName: string, subject: string, promptLength: number, responseStatus: 'success' | 'failed') => {
  if (!analytics) return;
  logEvent(analytics, 'ai_query_sent', {
    ai_model: modelName,
    subject: subject || 'general',
    prompt_length: promptLength,
    status: responseStatus
  });
};

// Track user retention and user attributes
export const setAnalyticsUser = (userId?: string, userRole = 'student') => {
  if (!analytics) return;
  if (userId) setUserId(analytics, userId);
  setUserProperties(analytics, { user_role: userRole });
};
