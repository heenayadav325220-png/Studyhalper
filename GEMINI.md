# Remix Study Buddy - Gemini API Guidelines

This document outlines standard instruction guidelines, model aliases, and integration patterns for building Gemini-powered features in Remix Study Buddy.

## Approved Models & Usage
- **Primary Text & Logic**: Use `gemini-2.5-flash` for high-speed student conversations, tutor questions, quiz generation, and quick homework solving.
- **Multimodal Visual Input**: Use `gemini-2.5-flash` when the student uploads homework photos, equations, diagrams, or handwritten notes.
- **Academic Diagram Descriptions**: Use `gemini-2.5-flash` to generate the logical structured explanations for academic study diagrams and textbook illustrations.

## Secret API Key Security
- **Strict Server-Side Isolation**: The `process.env.GEMINI_API_KEY` must only be loaded on the server-side proxy route.
- **Browser Protection**: Never prefix the main Gemini API key with `VITE_` or expose it in any frontend client source code.

## Integration Standards
- Use the modern `@google/genai` TypeScript SDK for all API operations.
- Format all AI responses inside the study UI using clean standard markdown, and render them using safe container wrappers with `react-markdown` to support bullet points, tables, and highlighted syntax.
