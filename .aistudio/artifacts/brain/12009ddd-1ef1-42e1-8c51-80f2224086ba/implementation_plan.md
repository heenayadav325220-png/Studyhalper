# Implementation Plan - Real-Time Multiplayer Study & Quiz Battle System

## 1. Overview
Implement a fully real-time multiplayer Quiz Battle and Shared Study Room system inside Ascend Study co-powered by Firebase Firestore and Gemini AI, with zero alterations to unrelated app UI.

## 2. Architecture & Data Flow

### Firebase Firestore Collections
- `quizRooms`: Rooms created by hosts with settings (subject, difficulty, questions, status).
- `quizRooms/{roomId}/participants`: Real-time participant roster, ready status, and scores.
- `quizRooms/{roomId}/answers`: Server-validated answer submissions and speed bonus tracking.
- `studyRooms`: Shared Pomodoro study rooms with synchronized timer state.

### Backend API Endpoints (`server.ts`)
- `POST /api/quiz-battle/create`: AI question generation via Gemini + room initialization.
- `POST /api/quiz-battle/join`: Room code validation and participant entry.
- `POST /api/quiz-battle/start`: Match start trigger by host.
- `POST /api/quiz-battle/submit-answer`: Server-side scoring (base points + speed bonus).
- `POST /api/study-rooms/timer`: Shared Pomodoro timer synchronization.

## 3. Frontend Implementation
- Create `src/components/MultiplayerBattleModal.tsx` maintaining the exact dark ambient theme (slate-950/indigo).
- Integration into existing dashboard/navigation via a prominent "Multiplayer Quiz Battle & Study Rooms" card/button.

## 4. Verification
- TypeScript type checking (`tsc --noEmit`).
- Production build compilation (`npm run build`).
