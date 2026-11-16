import { API_URL, USE_MOCK } from '@/config';
import { createApiSource } from './apiSource';
import { createMockSource } from './mockSource';
import type { DataSource } from './source';

/**
 * Picks the data source from the environment: the FastAPI server when EXPO_PUBLIC_API_URL is set and
 * EXPO_PUBLIC_USE_MOCK is not "true"; otherwise the in-memory mock (the demo-day fallback).
 */
export const dataSource: DataSource = USE_MOCK ? createMockSource() : createApiSource(API_URL);
