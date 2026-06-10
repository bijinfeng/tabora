import { describe, expect, it, vi } from "vitest"

import { taboraBrandFavicon } from "./vite"

describe("taboraBrandFavicon", () => {
  it("creates a build-safe Vite plugin for the Tabora favicon", () => {
    const plugin = taboraBrandFavicon()

    expect(plugin.name).toBe("tabora-brand-favicon")
    expect(plugin).not.toHaveProperty("buildStart")
    expect(plugin.transformIndexHtml?.("<html><head></head><body></body></html>")).toContain(
      '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    )
  })

  it("serves the favicon during Vite dev", () => {
    const plugin = taboraBrandFavicon()
    let middleware:
      | ((
          req: { url?: string },
          res: {
            statusCode: number
            setHeader(name: string, value: string): void
            end(body: string): void
          },
          next: () => void,
        ) => void)
      | undefined
    const server = {
      middlewares: {
        use: vi.fn((handler: NonNullable<typeof middleware>) => {
          middleware = handler
        }),
      },
    } satisfies Parameters<typeof plugin.configureServer>[0]

    plugin.configureServer?.(server)
    const response = {
      statusCode: 0,
      setHeader: vi.fn(),
      end: vi.fn(),
    }
    const next = vi.fn()

    middleware?.({ url: "/favicon.svg" }, response, next)

    expect(next).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(200)
    expect(response.setHeader).toHaveBeenCalledWith("Content-Type", "image/svg+xml")
    expect(response.end).toHaveBeenCalledWith(expect.stringContaining("<svg"))
  })

  it("emits the favicon during Vite build bundle generation", () => {
    const plugin = taboraBrandFavicon()
    const emitFile = vi.fn()

    plugin.generateBundle.call({ emitFile })

    expect(emitFile).toHaveBeenCalledWith({
      type: "asset",
      fileName: "favicon.svg",
      source: expect.stringContaining("<svg"),
    })
  })
})
