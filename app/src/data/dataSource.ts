import { API_URL, USE_MOCK } from '@/config';
import { createApiSource } from './apiSource';
import { createMockSource } from './mockSource';
import type { DataSource } from './source';

/**
 * The FastAPI server, always, unless EXPO_PUBLIC_USE_MOCK=true is set on purpose. There is no silent fallback: with no
 * EXPO_PUBLIC_API_URL (or an unreachable server) the app shows an error / Offline state instead of mock data.
 */
export const dataSource: DataSource = USE_MOCK ? createMockSource() : createApiSource(API_URL);
