import { DEMO, USE_MOCK } from '@/config';
import { createMockSource } from './mockSource';
import type { DataSource } from './source';

/**
 * Picks the data source from EXPO_PUBLIC_USE_MOCK. The API source arrives in Phase 5;
 * until then everything runs on the mock.
 */
export const dataSource: DataSource = (() => {
  if (!USE_MOCK) {
    // Phase 5: return createApiSource(API_URL). Falls back to the mock until it exists.
    console.warn('EXPO_PUBLIC_API_URL is set but the API source is not built yet; using the mock store.');
  }
  return createMockSource({ seed: DEMO });
})();
