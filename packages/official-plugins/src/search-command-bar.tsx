import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { PluginModule, SearchViewProps } from "@tabora/plugin-api/sdk"
import { Button } from "@tabora/ui/button"
import { CommandResultList } from "@tabora/ui/command-result-list"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { resolveDefaultProvider } from "@tabora/orchestrator"
import AtSign from "lucide-solid/icons/at-sign"
import Check from "lucide-solid/icons/check"
import ChevronDown from "lucide-solid/icons/chevron-down"
import Circle from "lucide-solid/icons/circle"
import Command from "lucide-solid/icons/command"
import CornerDownLeft from "lucide-solid/icons/corner-down-left"
import LayoutDashboard from "lucide-solid/icons/layout-dashboard"
import PanelTop from "lucide-solid/icons/panel-top"
import Plus from "lucide-solid/icons/plus"
import Puzzle from "lucide-solid/icons/puzzle"
import Search from "lucide-solid/icons/search"
import Settings from "lucide-solid/icons/settings"
import SunMoon from "lucide-solid/icons/sun-moon"
import { styles } from "./styles"
import { officialSearchCommandBarManifest } from "./ui-plugin-manifests"

type SearchResultItem = SearchViewProps["results"][number]["items"][number]
type SearchSuggestionItem = SearchResultItem & {
  submitQuery?: string
  submitProviderId?: string
  sourceResultId?: string
}

function getSearchResultIcon(item: Pick<SearchResultItem, "id" | "icon">) {
  if (item.icon === "corner-down-left") return <CornerDownLeft size={16} />
  if (item.id.startsWith("provider-") || item.icon === "at-sign") {
    return <AtSign size={16} />
  }
  if (item.id.startsWith("web-") || item.id.startsWith("web-search:") || item.icon === "search") {
    return <Search size={16} />
  }
  if (item.id.includes("command")) return <Command size={16} />
  if (item.id.includes("theme")) return <SunMoon size={16} />
  if (item.id.includes("layout")) return <LayoutDashboard size={16} />
  if (item.id.includes("add")) return <Plus size={16} />
  if (item.id.includes("widget")) return <PanelTop size={16} />
  if (item.id.includes("plugin")) return <Puzzle size={16} />
  if (item.id.includes("settings")) return <Settings size={16} />
  return <Circle size={16} />
}

export function SearchCommandBar(props: SearchViewProps) {
  let wrapperRef: HTMLDivElement | undefined
  const providers = createMemo(() => props.providers)
  const [providerOpen, setProviderOpen] = createSignal(false)
  const [searchFocused, setSearchFocused] = createSignal(false)
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
                  icon: "search",
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

  function toggleProviderDropdown() {
    setProviderOpen((open) => !open)
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
    <div
      {...stylex.attrs(styles.searchRoot)}
      data-search-command-bar
      ref={(element) => (wrapperRef = element)}
    >
      <Show
        when={!configurationError()}
        fallback={
          <InlineError>
            搜索不可用
            <span>{`：${configurationError()}`}</span>
          </InlineError>
        }
      >
        <form
          {...stylex.attrs(styles.searchBar)}
          data-search-bar-shell
          onSubmit={handleSubmit}
          onFocusIn={() => setSearchFocused(true)}
          onFocusOut={() => {
            setTimeout(() => {
              const activeElement = document.activeElement
              if (activeElement instanceof Node && wrapperRef?.contains(activeElement)) return

              setSearchFocused(false)
              setProviderOpen(false)
              props.host.close()
            }, 200)
          }}
        >
          <div {...stylex.attrs(styles.searchProvider)}>
            <Button
              size="sm"
              variant="secondary"
              xstyle={[
                styles.searchProviderButton,
                searchFocused() && styles.searchProviderButtonFocused,
              ]}
              aria-label="切换搜索引擎"
              aria-expanded={providerOpen()}
              data-search-provider-trigger
              onPointerDown={(event) => {
                event.preventDefault()
                toggleProviderDropdown()
              }}
              onClick={(event) => {
                if (event.detail === 0) toggleProviderDropdown()
              }}
            >
              <span
                {...stylex.attrs(styles.searchProviderDot)}
                aria-hidden="true"
                data-search-provider-dot
              />
              <span {...stylex.attrs(styles.searchProviderLabel)}>{activeProvider()!.title}</span>
              <ChevronDown size={10} {...stylex.attrs(styles.searchProviderCaret)} />
            </Button>
            <Show when={providerOpen()}>
              <div {...stylex.attrs(styles.searchProviderDropdown)} data-search-provider-dropdown>
                <For each={providers()}>
                  {(provider) => (
                    <Button
                      size="sm"
                      variant="ghost"
                      xstyle={[
                        styles.searchProviderOption,
                        provider.id === activeProvider()!.id && styles.selected,
                      ]}
                      data-search-provider-option
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleProviderChange(provider.id)
                      }}
                    >
                      <span {...stylex.attrs(styles.searchCheck)}>
                        <Show when={provider.id === activeProvider()!.id}>
                          <Check size={10} />
                        </Show>
                      </span>
                      <span>{provider.title}</span>
                    </Button>
                  )}
                </For>
              </div>
            </Show>
          </div>
          <span
            {...stylex.attrs(styles.searchDivider, searchFocused() && styles.searchDividerFocused)}
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query()}
            xstyle={styles.searchInput}
            inputAttrs={{ "data-search-inline-input": "" }}
            onInput={(nextQuery) => {
              setQuery(nextQuery)
              props.host.setQuery(nextQuery)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => props.host.open()}
            placeholder="搜索网页、命令或卡片"
            aria-label="搜索内容"
          />
          <span {...stylex.attrs(styles.searchKbd, searchFocused() && styles.searchKbdFocused)}>
            ⌘K
          </span>
        </form>
      </Show>

      <Show when={/^@\S+$/.test(query().trim())}>
        <div {...stylex.attrs(styles.searchState)}>
          继续输入查询以使用临时搜索源：
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={/^@\S+\s+/.test(query().trim()) && !!props.providerToken}>
        <div {...stylex.attrs(styles.searchState)}>
          当前临时搜索源：
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={props.isOpen && visibleResults().length > 0}>
        <div {...stylex.attrs(styles.searchSuggestions)} data-search-suggestions-surface>
          <CommandResultList
            groups={visibleResults().map((group) => ({
              id: group.id,
              label: group.label,
              items: group.items.map((item) => {
                const globalIdx = props.results
                  .flatMap((resultGroup) => resultGroup.items)
                  .findIndex((candidate) => candidate.id === item.id)

                return {
                  id: item.id,
                  icon: getSearchResultIcon(item),
                  name: item.name,
                  description: item.desc,
                  hint: item.hint,
                  active: props.activeResultIndex === globalIdx,
                  accentIcon: item.id.startsWith("web-search:"),
                  onSelect: () => {
                    if (item.id.startsWith("web-search:")) {
                      void props.host.submit(query(), item.id.slice("web-search:".length))
                      return
                    }
                    if (hasSubmitAction(item)) {
                      void props.host.submit(item.submitQuery, item.submitProviderId)
                      return
                    }
                    void props.host.executeSelection(globalIdx)
                  },
                }
              }),
            }))}
          />
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
      icon: "corner-down-left",
      name: "@github tabora runtime",
      desc: "用 GitHub 搜索插件运行时相关内容",
      submitQuery: "tabora plugin runtime",
      submitProviderId: providerIdFromResult(github),
      sourceResultId: github.id,
    },
    addWidget && {
      ...addWidget,
      icon: "corner-down-left",
      name: "添加便签卡片",
      desc: "创建一个新的 notes widget 实例",
    },
    pluginManager && {
      ...pluginManager,
      icon: "corner-down-left",
      name: "打开插件管理",
      desc: "查看 layout / widget / theme 贡献",
    },
    toggleTheme && {
      ...toggleTheme,
      icon: "corner-down-left",
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

export const officialSearchCommandBar: PluginModule = {
  manifest: officialSearchCommandBarManifest,
  activate(context) {
    context.views.register("official.search.command-bar.view", (props: SearchViewProps) =>
      SearchCommandBar(props),
    )
  },
}
