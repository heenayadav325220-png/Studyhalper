# Remix Study Buddy - Agent Custom Guidelines

This file defines the project conventions, system architecture rules, and tone requirements for any developer or AI assistant working on the Remix Study Buddy codebase.

## Project Vision
Remix Study Buddy is an advanced, ultra-modern full-stack educational assistant that empowers students with interactive features, group collaboration, visual study aids, mock exams, and persistent game mechanics (XP, streaks, quests, pet levels) synced in real-time.

## UI & Design Conventions
1. **Premium Dark Ambient Theme**:
   - The primary background must remain a deep, crisp, professional space color scheme (slate-900 / slate-950) with high contrast indigo (`indigo-600`), amber/emerald accents, and spacious padding.
   - Micro-animations (`motion` imports from `motion/react`) must be used for transitions, popups, and state toggles to make the interface feel live and reactive.

2. **Multilingual Architecture**:
   - Every user-facing UI element must support English and Hindi dynamically using the global `appLanguage` state. Use translating utilities from `/src/services/translations.ts`.

3. **Touch and Click Safety**:
   - Maintain minimum 44px touch targets on mobile displays and custom hover/scale-95 effects for interactive desktop buttons.

## Data Persistence Strategy
- **Local Fallback**: Local user data and transient preferences can fall back to `localStorage` or `mockDb` when offline.
- **Durable Firestore Sync**: Core collaboration (Group chats, live whiteboard vectors, shared document editors, real-time study rooms, scheduled pomodoro rooms) must use Firestore subscription paths documented in `/src/services/firebaseDb.ts` and `/firebase-blueprint.json`.

## Coding & Type Guidelines
- **Import Statements**: Always place named standard imports at the top level. Never use `import type` to import enum values.
- **Port Constraints**: The dev server is locked to port `3000`. Do not change or read the `PORT` environment variable.
- **No Infinite Renders**: Never trigger unsafely bounded `useEffect` updates on complex objects or functions without stable memoization references.
