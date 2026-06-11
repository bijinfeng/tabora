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

  it("renders the empty inline state as four prototype-style suggestions", () => {
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
            ],
            isOpen: true,
            results: [
              {
                id: "commands",
                label: "常用命令",
                items: [
                  { id: "open-command", icon: "⌘K", name: "打开命令", desc: "搜索命令" },
                  { id: "toggle-theme", icon: "T", name: "切换主题", desc: "明亮 → 暗色" },
                  { id: "toggle-layout", icon: "L", name: "切换布局", desc: "仪表盘 → 专注" },
                  { id: "add-widget", icon: "+", name: "添加卡片", desc: "向工作台添加新卡片" },
                  {
                    id: "open-plugin-manager",
                    icon: "P",
                    name: "打开插件管理",
                    desc: "查看 layout / widget / theme 贡献",
                  },
                ],
              },
              {
                id: "providers",
                label: "搜索源",
                items: [
                  { id: "provider-google", icon: "＠", name: "@g", desc: "搜索源 · Google" },
                  { id: "provider-github", icon: "＠", name: "@github", desc: "搜索源 · GitHub" },
                ],
              },
              {
                id: "widgets",
                label: "核心卡片",
                items: [{ id: "widget-notes", icon: "N", name: "便签", desc: "快速记录" }],
              },
            ],
          })}
        />
      ),
      root,
    )

    expect(
      Array.from(root.querySelectorAll(".suggestions-label")).map((node) => node.textContent),
    ).toEqual(["建议"])
    expect(
      Array.from(root.querySelectorAll(".suggestion-name")).map((node) => node.textContent),
    ).toEqual(["@github tabora runtime", "添加便签卡片", "打开插件管理", "切换到暗色主题"])
    expect(
      Array.from(root.querySelectorAll(".suggestion-icon")).map((node) => node.textContent),
    ).toEqual(["↵", "↵", "↵", "↵"])
    expect(root.textContent).not.toContain("常用命令")
    expect(root.textContent).not.toContain("核心卡片")
    root.remove()
  })

  it("keeps typed inline query visible while notifying the host", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const setQuery = vi.fn()

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
            host: {
              ...searchViewProps().host,
              setQuery,
            },
          })}
        />
      ),
      root,
    )

    const input = root.querySelector(".search-bar input") as HTMLInputElement
    input.value = "theme"
    input.dispatchEvent(new InputEvent("input", { bubbles: true }))

    expect(setQuery).toHaveBeenCalledWith("theme")
    expect(input.value).toBe("theme")
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
