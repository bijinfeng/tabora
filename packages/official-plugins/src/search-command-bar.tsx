import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { SearchViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { InlineError, Input, Kbd } from "@tabora/ui"
import { resolveDefaultProvider } from "@tabora/orchestrator"

type SearchResultItem = SearchViewProps["results"][number]["items"][number]
type SearchSuggestionItem = SearchResultItem & {
  submitQuery?: string
  submitProviderId?: string
  sourceResultId?: string
}

export function SearchCommandBar(props: SearchViewProps) {
  let wrapperRef: HTMLDivElement | undefined
  const providers = createMemo(() => props.providers)
  const [providerOpen, setProviderOpen] = createSignal(false)
  const [query, setQuery] = createSignal(props.query)
  const activeProvider = createMemo(() =>
    resolveDefaultProvider(providers(), props.activeProviderId),
  )
  const configurationError = createMemo(() => {
    if (providers().length === 0) return "未配置可用搜索源"
    if (!activeProvider()) return "默认搜索源不可用，请在设置中重新选择"
    return null
  })
  const providerStateLabel = createMemo(() => {
    if (!props.providerToken) {
      return ""
    }

    const provider = props.host.resolveProvider(props.providerToken)
    if (provider && /^@\S+\s+/.test(query().trim())) {
      return provider.title
    }

    return `@${props.providerToken}`
  })
  const visibleResults = createMemo(() => {
    const term = query().trim().toLowerCase()
    if (!term) return emptyInlineSuggestions(props.results)
    const filtered = props.results
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.name} ${item.desc} ${item.hint ?? ""}`.toLowerCase().includes(term),
        ),
      }))
      .filter((group) => group.items.length > 0)
    const provider = activeProvider()
    return [
      ...filtered,
      ...(provider
        ? [
            {
              id: "web",
              label: "搜索",
              items: [
                {
                  id: `web-search:${provider.id}`,
                  icon: "搜",
                  name: `使用 ${provider.title} 搜索 “${query().trim()}”`,
                  desc: "通过 external-open 权限桥打开",
                  hint: provider.shortcut,
                },
              ],
            },
          ]
        : []),
    ]
  })

  function handleSubmit(event: Event) {
    event.preventDefault()
    void props.host.submit(query())
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      props.host.moveSelection("next")
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      props.host.moveSelection("prev")
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      void props.host.executeSelection()
      return
    }

    if (event.key === "Escape") {
      props.host.close()
    }
  }

  function handleProviderChange(nextProviderId: string) {
    setProviderOpen(false)
    const result = props.host.setActiveProvider(nextProviderId)
    if (result instanceof Promise) {
      result.catch((error) => {
        console.warn("Failed to change default provider:", error)
      })
    }
  }

  onMount(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!providerOpen()) return
      const target = event.target
      if (target instanceof Node && wrapperRef?.contains(target)) return
      setProviderOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProviderOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    onCleanup(() => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    })
  })

  return (
    <div class="search-wrapper" ref={(element) => (wrapperRef = element)}>
      <Show
        when={!configurationError()}
        fallback={
          <InlineError>
            搜索不可用
            <span>{`：${configurationError()}`}</span>
          </InlineError>
        }
      >
        <form class="search-bar" onSubmit={handleSubmit}>
          <div class="search-provider">
            <button
              class="search-provider-btn"
              type="button"
              aria-label="切换搜索引擎"
              aria-expanded={providerOpen()}
              onClick={() => setProviderOpen((open) => !open)}
            >
              <span class="search-provider-dot" aria-hidden="true" />
              <span class="search-provider-label">{activeProvider()!.title}</span>
              <span class="search-provider-caret">▾</span>
            </button>
            <Show when={providerOpen()}>
              <div class="search-provider-dropdown">
                <For each={providers()}>
                  {(provider) => (
                    <button
                      class="sp-option"
                      classList={{ active: provider.id === activeProvider()!.id }}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleProviderChange(provider.id)
                      }}
                    >
                      <span class="sp-check">
                        {provider.id === activeProvider()!.id ? "✓" : ""}
                      </span>
                      <span>{provider.title}</span>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
          <span class="search-scope-divider" aria-hidden="true" />
          <Input
            type="search"
            value={query()}
            onInput={(nextQuery) => {
              setQuery(nextQuery)
              props.host.setQuery(nextQuery)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => props.host.open()}
            onBlur={() =>
              setTimeout(() => {
                setProviderOpen(false)
                props.host.close()
              }, 200)
            }
            placeholder="搜索网页、命令或卡片"
            aria-label="搜索内容"
          />
          <span class="search-kbd">⌘K</span>
        </form>
      </Show>

      <Show when={/^@\S+$/.test(query().trim())}>
        <div class="search-provider-state">
          继续输入查询以使用临时搜索源：
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={/^@\S+\s+/.test(query().trim()) && !!props.providerToken}>
        <div class="search-provider-state">
          当前临时搜索源：
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={props.isOpen && visibleResults().length > 0}>
        <div class="search-suggestions">
          <For each={visibleResults()}>
            {(group) => (
              <>
                <div class="suggestions-label">{group.label}</div>
                <For each={group.items}>
                  {(item) => {
                    const globalIdx = props.results
                      .flatMap((resultGroup) => resultGroup.items)
                      .findIndex((candidate) => candidate.id === item.id)
                    return (
                      <button
                        class="suggestion-item"
                        classList={{ active: props.activeResultIndex === globalIdx }}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          if (item.id.startsWith("web-search:")) {
                            void props.host.submit(query(), item.id.slice("web-search:".length))
                            return
                          }
                          if (hasSubmitAction(item)) {
                            void props.host.submit(item.submitQuery, item.submitProviderId)
                            return
                          }
                          void props.host.executeSelection(globalIdx)
                        }}
                        type="button"
                      >
                        <span class="suggestion-icon">{item.icon}</span>
                        <span class="suggestion-text">
                          <span class="suggestion-name">{item.name}</span>
                          <span class="suggestion-desc">{item.desc}</span>
                        </span>
                        <Show when={item.hint}>
                          <Kbd>{item.hint!}</Kbd>
                        </Show>
                      </button>
                    )
                  }}
                </For>
              </>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

function emptyInlineSuggestions(results: SearchViewProps["results"]): Array<{
  id: string
  label: string
  items: SearchSuggestionItem[]
}> {
  const items = results.flatMap((group) => group.items)
  const github = items.find(
    (item) =>
      item.id.includes("github") ||
      item.name.toLowerCase().includes("github") ||
      item.desc.toLowerCase().includes("github"),
  )
  const addWidget = findByText(items, ["添加", "卡片"])
  const pluginManager = findByText(items, ["插件", "管理"])
  const toggleTheme = findByText(items, ["切换", "主题"])
  const suggestions = [
    github && {
      ...github,
      id: `quick-github-runtime:${github.id}`,
      icon: "↵",
      name: "@github tabora runtime",
      desc: "用 GitHub 搜索插件运行时相关内容",
      submitQuery: "tabora plugin runtime",
      submitProviderId: providerIdFromResult(github),
      sourceResultId: github.id,
    },
    addWidget && {
      ...addWidget,
      icon: "↵",
      name: "添加便签卡片",
      desc: "创建一个新的 notes widget 实例",
    },
    pluginManager && {
      ...pluginManager,
      icon: "↵",
      name: "打开插件管理",
      desc: "查看 layout / widget / theme 贡献",
    },
    toggleTheme && {
      ...toggleTheme,
      icon: "↵",
      name: "切换到暗色主题",
      desc: "验证 Sage Dark token",
    },
  ].filter((item): item is SearchSuggestionItem => !!item)

  const fallback = items.filter(
    (item) =>
      !suggestions.some((suggestion) => (suggestion.sourceResultId ?? suggestion.id) === item.id),
  )
  const limited = [...suggestions, ...fallback].slice(0, 4)
  return limited.length > 0 ? [{ id: "suggestions", label: "建议", items: limited }] : []
}

function findByText(items: SearchResultItem[], parts: string[]): SearchResultItem | undefined {
  return items.find((item) =>
    parts.every((part) => `${item.name} ${item.desc}`.toLowerCase().includes(part.toLowerCase())),
  )
}

function providerIdFromResult(item: SearchResultItem): string | undefined {
  return item.id.startsWith("provider-") ? item.id.slice("provider-".length) : undefined
}

function hasSubmitAction(
  item: unknown,
): item is SearchSuggestionItem & { submitQuery: string; submitProviderId: string } {
  return (
    typeof (item as SearchSuggestionItem).submitQuery === "string" &&
    typeof (item as SearchSuggestionItem).submitProviderId === "string"
  )
}

export const officialSearchCommandBar: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.search.command-bar",
    name: "Tabora Search Command Bar",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./search-command-bar",
    styles: [{ href: "./search-command-bar.css", scope: "plugin", order: 30 }],
    engine: { platform: "^0.1.0" },
    permissions: [{ type: "external-open", hosts: ["*"] }],
    contributes: {
      searches: [
        {
          id: "official.search.command-bar",
          title: "搜索栏",
          defaultProviderIds: ["official.search.google", "official.search.bing"],
          supportsSuggestions: true,
          view: "official.search.command-bar.view",
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.search.command-bar.view", (props: SearchViewProps) =>
      SearchCommandBar(props),
    )
  },
}
