import { createMemo, createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SearchProviderContribution, SearchViewProps } from "@tabora/plugin-api"
import { Button, Input, InlineError, Select, Kbd } from "@tabora/ui"

const QUICK_TAGS = ["天气", "新闻", "翻译", "计算器", "汇率"]
const COMMANDS = [
  { icon: "🎨", name: "切换主题", desc: "明亮 ⇄ 暗色", group: "命令", hint: "⌘T" },
  { icon: "⇄", name: "切换布局", desc: "Dashboard ⇄ Stream", group: "命令", hint: "⌘L" },
  { icon: "+", name: "添加卡片", desc: "向工作台添加新卡片", group: "命令", hint: "⌘N" },
  { icon: "⚙", name: "打开设置", desc: "配置工作台", group: "命令", hint: "⌘," },
  { icon: "?", name: "快捷键", desc: "查看所有快捷键", group: "命令", hint: "?" },
] as const

const FALLBACK_PROVIDER: SearchProviderContribution = {
  id: "official.search.google",
  title: "Google",
  urlTemplate: "https://www.google.com/search?q={query}",
  shortcut: "g",
}

function providerOptions(providers: SearchProviderContribution[]) {
  return providers.map((p) => ({ value: p.id, label: p.title }))
}

export function buildSearchUrl(provider: SearchProviderContribution, query: string): string {
  return provider.urlTemplate.replaceAll("{query}", encodeURIComponent(query.trim()))
}

function resolveShortcut(
  query: string,
  providers: SearchProviderContribution[],
): { provider: SearchProviderContribution; searchQuery: string } | null {
  const trimmed = query.trim()
  const spaceIndex = trimmed.indexOf(" ")
  if (spaceIndex <= 0) return null
  const shortcut = trimmed.slice(0, spaceIndex)
  const provider = providers.find(
    (p) => p.shortcut && p.shortcut.toLowerCase() === shortcut.toLowerCase(),
  )
  if (!provider) return null
  return { provider, searchQuery: trimmed.slice(spaceIndex + 1).trim() }
}

type Suggestion = {
  icon: string
  name: string
  desc: string
  group: string
  hint: string
  action: () => void
}

export function safelyHandleProviderChange(
  onChange: ((id: string) => void | Promise<void>) | undefined,
  nextProviderId: string,
): void {
  const result = onChange?.(nextProviderId)
  if (result instanceof Promise) {
    result.catch((err) => {
      console.warn("Failed to change default provider:", err)
    })
  }
}

export function SearchCommandBar(props: SearchViewProps) {
  const providers = createMemo(() =>
    props.providers.length > 0 ? props.providers : [FALLBACK_PROVIDER],
  )
  const [providerId, setProviderId] = createSignal(props.defaultProviderId || providers()[0]!.id)
  const [query, setQuery] = createSignal("")
  const [focused, setFocused] = createSignal(false)
  const [permissionDenied, setPermissionDenied] = createSignal(false)
  const [suggestIdx, setSuggestIdx] = createSignal(-1)

  const activeProvider = createMemo(() => {
    const match = providers().find((p) => p.id === providerId())
    return match ?? providers()[0]!
  })

  const suggestions = createMemo((): Suggestion[] => {
    const q = query().toLowerCase().trim()
    if (!q) return []
    const results: Suggestion[] = []

    for (const cmd of COMMANDS) {
      if (cmd.name.includes(q) || cmd.desc.includes(q)) {
        results.push({
          ...cmd,
          action: () => {
            /* handled by keyboard navigation */
          },
        })
      }
    }

    results.push({
      icon: "🔍",
      name: `在 ${activeProvider().title} 中搜索 "${query().trim()}"`,
      desc: "直接搜索网页",
      group: "搜索",
      hint: activeProvider().shortcut ?? "",
      action: () => doSearch(query().trim()),
    })

    return results
  })

  const groupedSuggestions = createMemo(() => {
    const groups: Record<string, Suggestion[]> = {}
    for (const s of suggestions()) {
      const g = groups[s.group] ?? (groups[s.group] = [])
      g.push(s)
    }
    return groups
  })

  function doSearch(q: string, targetProvider?: SearchProviderContribution) {
    setPermissionDenied(false)
    const provider = targetProvider ?? activeProvider()
    const url = buildSearchUrl(provider, q)
    const opened = props.openExternal?.(url)
    if (!opened) {
      setPermissionDenied(true)
      return
    }
    void props.onSaveHistory?.({ query: q, providerId: provider.id })
  }

  function handleSubmit(event: Event) {
    event.preventDefault()
    const q = query().trim()
    if (!q) return
    const resolved = resolveShortcut(q, providers())
    if (resolved) {
      doSearch(resolved.searchQuery, resolved.provider)
    } else {
      doSearch(q)
    }
    setQuery("")
    setSuggestIdx(-1)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSuggestIdx((i) => Math.min(i + 1, suggestions().length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSuggestIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const idx = suggestIdx()
      if (idx >= 0 && idx < suggestions().length) {
        suggestions()[idx]?.action()
        setQuery("")
        setSuggestIdx(-1)
      } else {
        const q = query().trim()
        if (q) {
          const resolved = resolveShortcut(q, providers())
          if (resolved) doSearch(resolved.searchQuery, resolved.provider)
          else doSearch(q)
          setQuery("")
        }
      }
    } else if (e.key === "Escape") {
      setSuggestIdx(-1)
      setFocused(false)
    }
  }

  function handleProviderChange(nextProviderId: string) {
    setProviderId(nextProviderId)
    const result = props.onDefaultProviderChange?.(nextProviderId)
    if (result instanceof Promise) {
      result.catch((err) => console.warn("Failed to change default provider:", err))
    }
  }

  return (
    <div class="search-wrapper">
      <form class="search-bar" onSubmit={handleSubmit}>
        <Select<string>
          value={activeProvider().id}
          options={providerOptions(providers())}
          onChange={(v) => handleProviderChange(v)}
          aria-label="搜索源"
          size="sm"
        />
        <Input
          value={query()}
          onInput={(v) => {
            setQuery(v)
            setSuggestIdx(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() =>
            setTimeout(() => {
              setFocused(false)
              setSuggestIdx(-1)
            }, 200)
          }
          placeholder="搜索或输入命令... @google 切换引擎"
          aria-label="搜索内容"
          type="search"
        />
        <Button type="submit" variant="primary" size="sm">
          搜索
        </Button>
      </form>

      <Show when={permissionDenied()}>
        <InlineError>外部打开被拒绝，请检查权限设置</InlineError>
      </Show>

      <Show when={focused() && suggestions().length > 0}>
        <div class="search-suggestions">
          <For each={Object.entries(groupedSuggestions())}>
            {([group, items]) => (
              <>
                <div class="suggestions-label">{group}</div>
                <For each={items}>
                  {(item) => {
                    const globalIdx = suggestions().indexOf(item)
                    return (
                      <button
                        class="suggestion-item"
                        classList={{ active: suggestIdx() === globalIdx }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          item.action()
                          setQuery("")
                          setSuggestIdx(-1)
                        }}
                        type="button"
                      >
                        <span class="suggestion-icon">{item.icon}</span>
                        <span class="suggestion-text">
                          <span class="suggestion-name">{item.name}</span>
                          <span class="suggestion-desc">{item.desc}</span>
                        </span>
                        <Show when={item.hint}>
                          <Kbd>{item.hint}</Kbd>
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

      <Show when={focused() && query().length === 0 && suggestions().length === 0}>
        <div class="search-suggestions">
          <div class="suggestions-label">快捷搜索</div>
          <div class="quick-tags">
            <For each={QUICK_TAGS}>
              {(tag) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery(tag)
                    doSearch(tag)
                  }}
                >
                  {tag}
                </Button>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}

export const officialSearchCommandBar: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.search.command-bar",
    name: "Tabora Search Command Bar",
    version: "0.0.0",
    entry: "./search-command-bar",
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
      SearchCommandBar({
        ...props,
        openExternal: (url) => context.permissions.openExternal(url),
      }),
    )
  },
}
