/** Build-time flags (EXPO_PUBLIC_* values are inlined by Expo at bundle time). */

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Run the whole app on the in-memory mock store. Also the default while no API URL is set. */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true' || API_URL === '';

/** Show "Demo tools" on the You screen and seed the day-5 demo duels on first launch. */
export const DEMO = process.env.EXPO_PUBLIC_DEMO === 'true';
