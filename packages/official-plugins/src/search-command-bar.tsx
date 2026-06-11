import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { SearchViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { InlineError, Kbd } from "@tabora/ui"
import { resolveDefaultProvider } from "@tabora/orchestrator"

type SearchResultItem = SearchViewProps["results"][number]["items"][number]
type SearchSuggestionItem = SearchResultItem & {
  submitQuery?: string
  submitProviderId?: string
  sourceResultId?: string
}

type InjectedI18n = {
  t: (key: string, vars?: Record<string, string | number>) => string
}

function resolveI18n(props: SearchViewProps): InjectedI18n | undefined {
  return (props as SearchViewProps & { i18n?: InjectedI18n }).i18n
}

function fallbackText(key: string, vars?: Record<string, string | number>) {
  const template =
    {
      "search.errors.noProviders": "未配置可用搜索源",
      "search.errors.defaultUnavailable": "默认搜索源不可用，请在设置中重新选择",
      "search.group.web": "搜索",
      "search.webSuggestion.icon": "搜",
      "search.webSuggestion.name": "使用 {{provider}} 搜索 “{{query}}”",
      "search.webSuggestion.desc": "通过 external-open 权限桥打开",
      "search.unavailable": "搜索不可用",
      "search.provider.switchAria": "切换搜索引擎",
      "search.placeholder": "搜索网页、命令或卡片",
      "search.ariaLabel": "搜索内容",
      "search.providerState.continue": "继续输入查询以使用临时搜索源：",
      "search.providerState.current": "当前临时搜索源：",
      "search.suggestions.label": "建议",
      "search.suggestions.githubRuntime.desc": "用 GitHub 搜索插件运行时相关内容",
      "search.suggestions.addNotes.name": "添加便签卡片",
      "search.suggestions.addNotes.desc": "创建一个新的 notes widget 实例",
      "search.suggestions.openPluginManager.name": "打开插件管理",
      "search.suggestions.openPluginManager.desc": "查看 layout / widget / theme 贡献",
      "search.suggestions.switchToDark.name": "切换到暗色主题",
      "search.suggestions.switchToDark.desc": "验证 Sage Dark token",
    }[key] ?? key

  if (!vars) return template
  let result = template
  for (const [varKey, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${varKey}}}`, String(value))
  }
  return result
}

export function SearchCommandBar(props: SearchViewProps) {
  let wrapperRef: HTMLDivElement | undefined
  const t = (key: string, vars?: Record<string, string | number>) =>
    resolveI18n(props)?.t(key, vars) ?? fallbackText(key, vars)
  const providers = createMemo(() => props.providers)
  const [providerOpen, setProviderOpen] = createSignal(false)
  const [query, setQuery] = createSignal(props.query)
  const activeProvider = createMemo(() =>
    resolveDefaultProvider(providers(), props.activeProviderId),
  )
  const configurationError = createMemo(() => {
    if (providers().length === 0) return t("search.errors.noProviders")
    if (!activeProvider()) return t("search.errors.defaultUnavailable")
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
    if (!term) return emptyInlineSuggestions(props.results, t)
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
              label: t("search.group.web"),
              items: [
                {
                  id: `web-search:${provider.id}`,
                  icon: t("search.webSuggestion.icon"),
                  name: t("search.webSuggestion.name", {
                    provider: provider.title,
                    query: query().trim(),
                  }),
                  desc: t("search.webSuggestion.desc"),
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
            {t("search.unavailable")}
            <span>{`：${configurationError()}`}</span>
          </InlineError>
        }
      >
        <form class="search-bar" onSubmit={handleSubmit}>
          <div class="search-provider">
            <button
              class="search-provider-btn"
              type="button"
              aria-label={t("search.provider.switchAria")}
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
          <input
            value={query()}
            onInput={(event) => {
              const nextQuery = event.currentTarget.value
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
            placeholder={t("search.placeholder")}
            aria-label={t("search.ariaLabel")}
            type="search"
          />
          <span class="search-kbd">⌘K</span>
        </form>
      </Show>

      <Show when={/^@\S+$/.test(query().trim())}>
        <div class="search-provider-state">
          {t("search.providerState.continue")}
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={/^@\S+\s+/.test(query().trim()) && !!props.providerToken}>
        <div class="search-provider-state">
          {t("search.providerState.current")}
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

function emptyInlineSuggestions(
  results: SearchViewProps["results"],
  t: (key: string, vars?: Record<string, string | number>) => string,
): Array<{
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
  const addWidget = findByText(items, ["添加", "卡片"]) ?? findByText(items, ["add", "widget"])
  const pluginManager =
    findByText(items, ["插件", "管理"]) ?? findByText(items, ["plugin", "manager"])
  const toggleTheme = findByText(items, ["切换", "主题"]) ?? findByText(items, ["toggle", "theme"])
  const suggestions = [
    github && {
      ...github,
      id: `quick-github-runtime:${github.id}`,
      icon: "↵",
      name: "@github tabora runtime",
      desc: t("search.suggestions.githubRuntime.desc"),
      submitQuery: "tabora plugin runtime",
      submitProviderId: providerIdFromResult(github),
      sourceResultId: github.id,
    },
    addWidget && {
      ...addWidget,
      icon: "↵",
      name: t("search.suggestions.addNotes.name"),
      desc: t("search.suggestions.addNotes.desc"),
    },
    pluginManager && {
      ...pluginManager,
      icon: "↵",
      name: t("search.suggestions.openPluginManager.name"),
      desc: t("search.suggestions.openPluginManager.desc"),
    },
    toggleTheme && {
      ...toggleTheme,
      icon: "↵",
      name: t("search.suggestions.switchToDark.name"),
      desc: t("search.suggestions.switchToDark.desc"),
    },
  ].filter((item): item is SearchSuggestionItem => !!item)

  const fallback = items.filter(
    (item) =>
      !suggestions.some((suggestion) => (suggestion.sourceResultId ?? suggestion.id) === item.id),
  )
  const limited = [...suggestions, ...fallback].slice(0, 4)
  return limited.length > 0
    ? [{ id: "suggestions", label: t("search.suggestions.label"), items: limited }]
    : []
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
    context.i18n?.registerMessages([
      {
        locale: "zh-CN",
        messages: {
          "search.errors.noProviders": "未配置可用搜索源",
          "search.errors.defaultUnavailable": "默认搜索源不可用，请在设置中重新选择",
          "search.group.web": "搜索",
          "search.webSuggestion.icon": "搜",
          "search.webSuggestion.name": "使用 {{provider}} 搜索 “{{query}}”",
          "search.webSuggestion.desc": "通过 external-open 权限桥打开",
          "search.unavailable": "搜索不可用",
          "search.provider.switchAria": "切换搜索引擎",
          "search.placeholder": "搜索网页、命令或卡片",
          "search.ariaLabel": "搜索内容",
          "search.providerState.continue": "继续输入查询以使用临时搜索源：",
          "search.providerState.current": "当前临时搜索源：",
          "search.suggestions.label": "建议",
          "search.suggestions.githubRuntime.desc": "用 GitHub 搜索插件运行时相关内容",
          "search.suggestions.addNotes.name": "添加便签卡片",
          "search.suggestions.addNotes.desc": "创建一个新的 notes widget 实例",
          "search.suggestions.openPluginManager.name": "打开插件管理",
          "search.suggestions.openPluginManager.desc": "查看 layout / widget / theme 贡献",
          "search.suggestions.switchToDark.name": "切换到暗色主题",
          "search.suggestions.switchToDark.desc": "验证 Sage Dark token",
        },
      },
      {
        locale: "en-US",
        messages: {
          "search.errors.noProviders": "No search providers configured",
          "search.errors.defaultUnavailable":
            "Default provider is unavailable. Choose another one in Settings.",
          "search.group.web": "Web",
          "search.webSuggestion.icon": "Web",
          "search.webSuggestion.name": "Search {{provider}} for “{{query}}”",
          "search.webSuggestion.desc": "Opens via the external-open permission bridge",
          "search.unavailable": "Search unavailable",
          "search.provider.switchAria": "Switch search provider",
          "search.placeholder": "Search the web, commands, or widgets",
          "search.ariaLabel": "Search",
          "search.providerState.continue": "Keep typing to use the temporary provider:",
          "search.providerState.current": "Temporary provider:",
          "search.suggestions.label": "Suggestions",
          "search.suggestions.githubRuntime.desc": "Search plugin runtime topics on GitHub",
          "search.suggestions.addNotes.name": "Add notes widget",
          "search.suggestions.addNotes.desc": "Create a new notes widget instance",
          "search.suggestions.openPluginManager.name": "Open plugins",
          "search.suggestions.openPluginManager.desc": "View layout / widget / theme contributions",
          "search.suggestions.switchToDark.name": "Switch to dark theme",
          "search.suggestions.switchToDark.desc": "Verify Sage Dark tokens",
        },
      },
    ])

    context.registry.views.register("official.search.command-bar.view", (props: SearchViewProps) =>
      SearchCommandBar({ ...props, i18n: context.i18n } as SearchViewProps & {
        i18n?: InjectedI18n
      }),
    )
  },
}
