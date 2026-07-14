import { beforeEach, describe, expect, it, vi } from "vitest"
import { createChromeStorageAuthStorage, createLocalStorageAuthStorage } from "./authStorage"

describe("createLocalStorageAuthStorage", () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
    })
  })

  it("sets and gets items from localStorage", async () => {
    const storage = createLocalStorageAuthStorage()

    await storage.setItem("test-key", "test-value")
    const value = await storage.getItem("test-key")

    expect(value).toBe("test-value")
  })

  it("returns null for missing keys", async () => {
    const storage = createLocalStorageAuthStorage()

    const value = await storage.getItem("missing-key")

    expect(value).toBeNull()
  })

  it("removes items from localStorage", async () => {
    const storage = createLocalStorageAuthStorage()

    await storage.setItem("test-key", "test-value")
    await storage.removeItem("test-key")
    const value = await storage.getItem("test-key")

    expect(value).toBeNull()
  })
})

describe("createChromeStorageAuthStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn(),
        },
      },
    })
  })

  it("sets and gets items from chrome.storage.local", async () => {
    const mockGet = vi.fn().mockResolvedValue({ "test-key": "test-value" })
    const mockSet = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: mockGet,
          set: mockSet,
          remove: vi.fn(),
        },
      },
    })

    const storage = createChromeStorageAuthStorage()

    await storage.setItem("test-key", "test-value")
    expect(mockSet).toHaveBeenCalledWith({ "test-key": "test-value" })

    const value = await storage.getItem("test-key")
    expect(mockGet).toHaveBeenCalledWith("test-key")
    expect(value).toBe("test-value")
  })

  it("returns null for missing keys", async () => {
    const mockGet = vi.fn().mockResolvedValue({})
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: mockGet,
          set: vi.fn(),
          remove: vi.fn(),
        },
      },
    })

    const storage = createChromeStorageAuthStorage()
    const value = await storage.getItem("missing-key")

    expect(value).toBeNull()
  })

  it("removes items from chrome.storage.local", async () => {
    const mockRemove = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
          remove: mockRemove,
        },
      },
    })

    const storage = createChromeStorageAuthStorage()
    await storage.removeItem("test-key")

    expect(mockRemove).toHaveBeenCalledWith("test-key")
  })

  it("throws when chrome.storage.local is not available", () => {
    vi.stubGlobal("chrome", undefined)

    expect(() => createChromeStorageAuthStorage()).toThrow("chrome.storage.local is not available")
  })
})
