/** Build-time flags (EXPO_PUBLIC_* values are inlined by Expo at bundle time). */

/** The FastAPI server. Required: without it the app shows a clear error instead of pretending to work. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();

/**
 * Explicit opt-in to the in-memory mock (a single local user, nothing saved). Off by default: the app never falls back
 * to mock data on its own when the API is missing or unreachable.
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
