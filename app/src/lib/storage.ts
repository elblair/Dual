import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Tiny async key-value store: SecureStore on phones, localStorage on web. Never throws (storage can be blocked). */
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      /* storage blocked: the session just will not survive a restart */
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
  },
};
