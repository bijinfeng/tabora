import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"

import { SearchCommandBar } from "./search-command-bar"

describe("SearchCommandBar", () => {
  it("shows an inline error when no search providers are available", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <SearchCommandBar
          providers={[]}
          defaultProviderId="official.search.google"
          commands={[]}
          widgets={[]}
          onDefaultProviderChange={vi.fn()}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("搜索不可用")
    expect(root.textContent).toContain("未配置可用搜索源")
    root.remove()
  })

  it("shows an inline error when the configured default provider is unavailable", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <SearchCommandBar
          providers={[
            {
              id: "official.search.bing",
              title: "Bing",
              shortcut: "b",
              urlTemplate: "https://bing.example/search?q={query}",
            },
          ]}
          defaultProviderId="official.search.google"
          commands={[]}
          widgets={[]}
          onDefaultProviderChange={vi.fn()}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("搜索不可用")
    expect(root.textContent).toContain("默认搜索源不可用")
    root.remove()
  })
})
