import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, '../../firebase-applet-config.json');

let firebaseConfig: any = {};
try {
  firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (err) {
  console.warn('[Firebase Admin Config] Could not parse config file, relying on env vars:', err);
}

if (!getApps().length) {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
