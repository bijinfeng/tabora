import { describe, expect, it } from "vitest"

import { canPluginOpenExternal } from "./shellController"

describe("canPluginOpenExternal", () => {
  const plugins = [
    {
      manifest: {
        id: "trusted.widget",
        permissions: [{ type: "external-open" as const, hosts: ["example.com"] }],
      },
      installation: {
        grantedPermissions: [{ type: "external-open" as const, hosts: ["example.com"] }],
      },
    },
    {
      manifest: {
        id: "wildcard.widget",
        permissions: [{ type: "external-open" as const, hosts: ["*"] }],
      },
      installation: {
        grantedPermissions: [{ type: "external-open" as const, hosts: ["*"] }],
      },
    },
    {
      manifest: {
        id: "plain.widget",
      },
      installation: { grantedPermissions: [] },
    },
  ]

  it("rejects invalid URLs", () => {
    expect(canPluginOpenExternal({ pluginId: "trusted.widget", url: "not a url", plugins })).toBe(
      false,
    )
  })

  it("rejects missing plugins and plugins without matching external-open permission", () => {
    expect(
      canPluginOpenExternal({
        pluginId: "missing.widget",
        url: "https://example.com",
        plugins,
      }),
    ).toBe(false)
    expect(
      canPluginOpenExternal({
        pluginId: "plain.widget",
        url: "https://example.com",
        plugins,
      }),
    ).toBe(false)
    expect(
      canPluginOpenExternal({
        pluginId: "trusted.widget",
        url: "https://github.com",
        plugins,
      }),
    ).toBe(false)
  })

  it("allows exact host and wildcard external-open permissions", () => {
    expect(
      canPluginOpenExternal({
        pluginId: "trusted.widget",
        url: "https://example.com/docs",
        plugins,
      }),
    ).toBe(true)
    expect(
      canPluginOpenExternal({
        pluginId: "wildcard.widget",
        url: "https://github.com/tabora",
        plugins,
      }),
    ).toBe(true)
  })
})
