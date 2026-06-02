import { describe, expect, it, vi } from "vitest"
import { safelyHandleProviderChange } from "./search-command-bar"
import { buildSearchUrl } from "./search-model"
import type { SearchProviderContribution } from "@tabora/plugin-api"

describe("buildSearchUrl", () => {
  it("replaces multiple {query} placeholders and URL-encodes the trimmed query", () => {
    const provider: SearchProviderContribution = {
      id: "test",
      title: "Test",
      urlTemplate: "https://example.com/search?q={query}&ref={query}",
    }

    const result = buildSearchUrl(provider, "  hello world  ")

    expect(result).toBe("https://example.com/search?q=hello%20world&ref=hello%20world")
  })
})

describe("safelyHandleProviderChange", () => {
  it("catches a rejected onDefaultProviderChange and logs console.warn", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    const rejectingFn = () => Promise.reject(new Error("change failed"))
    safelyHandleProviderChange(rejectingFn, "test-id")

    await new Promise((r) => setTimeout(r, 10))

    expect(warnSpy).toHaveBeenCalledWith("Failed to change default provider:", expect.any(Error))

    warnSpy.mockRestore()
  })
})
