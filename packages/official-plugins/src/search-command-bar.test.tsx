import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"
import type { SearchViewProps } from "@tabora/plugin-api"

import { SearchCommandBar } from "./search-command-bar"

function searchViewProps(overrides: Partial<SearchViewProps> = {}): SearchViewProps {
  return {
    entry: "inline",
    providers: [],
    defaultProviderId: "official.search.google",
    activeProviderId: "official.search.google",
    query: "",
    providerToken: null,
    recentSearches: [],
    results: [],
    activeResultIndex: -1,
    isOpen: false,
    host: {
      setQuery: vi.fn(),
      submit: vi.fn(async () => {}),
      setActiveProvider: vi.fn(),
      resolveProvider: vi.fn(() => null),
      moveSelection: vi.fn(),
      executeSelection: vi.fn(async () => {}),
      open: vi.fn(),
      close: vi.fn(),
      showToast: vi.fn(),
    },
    ...overrides,
  }
}

describe("SearchCommandBar", () => {
  it("shows an inline error when no search providers are available", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <SearchCommandBar {...searchViewProps({ providers: [] })} />, root)

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
          {...searchViewProps({
            providers: [
              {
                id: "official.search.bing",
                title: "Bing",
                shortcut: "b",
                urlTemplate: "https://bing.example/search?q={query}",
              },
            ],
          })}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("搜索不可用")
    expect(root.textContent).toContain("默认搜索源不可用")
    root.remove()
  })

  it("renders host-provided results and executes the clicked result through host actions", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const executeSelection = vi.fn(async () => {})

    render(
      () => (
        <SearchCommandBar
          {...searchViewProps({
            providers: [
              {
                id: "official.search.google",
                title: "Google",
                shortcut: "g",
                urlTemplate: "https://google.example/search?q={query}",
              },
            ],
            isOpen: true,
            query: "tabora",
            results: [
              {
                id: "search",
                label: "搜索",
                items: [
                  {
                    id: "web-google",
                    icon: "🔍",
                    name: '在 Google 中搜索 "tabora"',
                    desc: "网页搜索",
                    hint: "g",
                  },
                ],
              },
            ],
            host: {
              ...searchViewProps().host,
              executeSelection,
            },
          })}
        />
      ),
      root,
    )

    const button = root.querySelector(".suggestion-item") as HTMLButtonElement | null
    expect(button?.textContent).toContain("在 Google 中搜索")
    button?.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))

    expect(executeSelection).toHaveBeenCalledWith(0)
    root.remove()
  })

  it("closes the provider dropdown with Escape and outside click", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <SearchCommandBar
          {...searchViewProps({
            providers: [
              {
                id: "official.search.google",
                title: "Google",
                shortcut: "g",
                urlTemplate: "https://google.example/search?q={query}",
              },
              {
                id: "official.search.bing",
                title: "Bing",
                shortcut: "b",
                urlTemplate: "https://bing.example/search?q={query}",
              },
            ],
          })}
        />
      ),
      root,
    )

    const button = root.querySelector(".search-provider-btn") as HTMLButtonElement
    button.click()
    expect(root.querySelector(".search-provider-dropdown")).toBeTruthy()

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    expect(root.querySelector(".search-provider-dropdown")).toBeNull()

    button.click()
    expect(root.querySelector(".search-provider-dropdown")).toBeTruthy()
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }))
    expect(root.querySelector(".search-provider-dropdown")).toBeNull()

    root.remove()
  })
})
