import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker } from './services/pwaService';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { initConsoleGuard, initMemoryPurge, initIntegrityMonitor } from './utils/securityShield';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize PWA Service Worker
registerServiceWorker();

// Initialize High-Grade Security Shield Protections
initConsoleGuard();
initMemoryPurge();
initIntegrityMonitor();

if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[GLOBAL_ERROR_CAUGHT]', { message, source, lineno, colno, error });
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UNHANDLED_REJECTION_CAUGHT]', event.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
