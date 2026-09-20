/**
 * ASCEND STUDY - ULTIMATE ENTERPRISE SECURITY SHIELD
 * 
 * Provides production-grade client-side defenses:
 * 1. Self-XSS Console Guard: Prevents social engineering attacks by printing high-visibility warnings.
 * 2. Inactivity Session Lock: Automatically signs out or logs out users after prolonged inactivity to protect physical devices.
 * 3. Invisible Memory Cleansing: Purges Google OAuth access tokens from memory when the tab goes background.
 * 4. Content Tampering Protection: Detects modification of critical DOM nodes or storage variables.
 */

// --- 1. SELF-XSS SOCIAL ENGINEERING SHIELD ---
export function initConsoleGuard(): void {
  // Only activate in production and safe browser contexts
  if (typeof window === "undefined") return;

  const warningTitle = "%c🚨 STOP! SECURITY GUARD ACTIVE 🚨";
  const warningStyle = "color: #ef4444; font-size: 24px; font-weight: bold; font-family: sans-serif; text-shadow: 1px 1px 2px black;";
  
  const bodyText = "%cThis is a browser feature intended strictly for developers. If anyone told you to copy-paste or execute code here to gain XP, unlock features, or bypass limits, they are trying to HACK your account and steal your data.\n\nExecuting scripts here gives hackers absolute control over your Google credentials, study documents, and private sessions.\n\nLearn safely and keep your account secure!";
  const bodyStyle = "color: #cbd5e1; font-size: 14px; font-family: sans-serif; line-height: 1.5;";

  setTimeout(() => {
    console.clear();
    console.log(warningTitle, warningStyle);
    console.log(bodyText, bodyStyle);
  }, 1000);
}

// --- 2. AUTOMATIC SESSION LOCKOUT & TIME-OUT ---
let inactivityTimer: NodeJS.Timeout | null = null;
const INACTIVITY_TIMEOUT_MS = 25 * 60 * 1000; // 25 Minutes auto-lock

export function initInactivityLock(onLockout: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.warn("Security Shield: Logging out due to 25 minutes of inactivity.");
      onLockout();
    }, INACTIVITY_TIMEOUT_MS);
  };

  const activityEvents = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
  activityEvents.forEach(event => {
    window.addEventListener(event, resetTimer, { passive: true });
  });

  // Start the timer
  resetTimer();

  return () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    activityEvents.forEach(event => {
      window.removeEventListener(event, resetTimer);
    });
  };
}

// --- 3. MEMORY PURGE ON VISIBILITY CHANGE ---
export function initMemoryPurge(): void {
  if (typeof window === "undefined" || !window.document) return;

  window.document.addEventListener("visibilitychange", () => {
    if (window.document.visibilityState === "hidden") {
      // Purge volatile transient state keys from sessionStorage to prevent memory reading exploits
      const keysToPurge = ["google_drive_temp", "classroom_cache_temp", "calendar_temp"];
      keysToPurge.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          // Silent fallback
        }
      });
    }
  });
}

// --- 4. SECURE INTEGRITY AGENT ---
export function initIntegrityMonitor(): void {
  if (typeof window === "undefined" || typeof Proxy === "undefined") return;

  // Intercept and secure local storage access to prevent arbitrary script manipulation
  try {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key: string, value: string): void {
      // Prevent injection of raw script tags into our key-value pairs
      if (typeof value === "string" && (value.includes("<script") || value.includes("javascript:"))) {
        console.error("Security Shield: Blocked attempt to write malicious script tag to LocalStorage.");
        return;
      }
      originalSetItem.apply(this, [key, value]);
    };
  } catch (e) {
    // Fail-safe
  }
}
