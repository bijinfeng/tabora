/**
 * Auth storage adapter interface for Supabase session persistence.
 * Extension MV3 service workers don't have localStorage, so we need
 * to inject platform-specific storage adapters.
 */
export type AuthStorage = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

/**
 * Create localStorage-based auth storage for web/playground.
 */
export function createLocalStorageAuthStorage(): AuthStorage {
  return {
    async getItem(key) {
      return localStorage.getItem(key)
    },
    async setItem(key, value) {
      localStorage.setItem(key, value)
    },
    async removeItem(key) {
      localStorage.removeItem(key)
    },
  }
}

/**
 * Create chrome.storage.local-based auth storage for MV3 extensions.
 * chrome.storage.local persists across service worker restarts.
 */
export function createChromeStorageAuthStorage(): AuthStorage {
  const chromeStorage = (globalThis as unknown as { chrome?: { storage?: { local?: any } } }).chrome
    ?.storage?.local
  if (!chromeStorage) {
    throw new Error("chrome.storage.local is not available")
  }

  return {
    async getItem(key) {
      const result = await chromeStorage.get(key)
      return result[key] ?? null
    },
    async setItem(key, value) {
      await chromeStorage.set({ [key]: value })
    },
    async removeItem(key) {
      await chromeStorage.remove(key)
    },
  }
}
