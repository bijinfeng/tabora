import { createMemo, createSignal, For, Show } from "solid-js"
import type { SearchViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { InlineError, Kbd } from "@tabora/ui"
import { resolveDefaultProvider } from "@tabora/orchestrator"

export function SearchCommandBar(props: SearchViewProps) {
  const providers = createMemo(() => props.providers)
  const [providerOpen, setProviderOpen] = createSignal(false)
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
    if (provider && /^@\S+\s+/.test(props.query.trim())) {
      return provider.title
    }

    return `@${props.providerToken}`
  })

  function handleSubmit(event: Event) {
    event.preventDefault()
    void props.host.submit(props.query)
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

  return (
    <div class="search-wrapper">
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
          <input
            value={props.query}
            onInput={(event) => {
              props.host.setQuery(event.currentTarget.value)
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
            type="search"
          />
          <span class="search-kbd">⌘K</span>
        </form>
      </Show>

      <Show when={/^@\S+$/.test(props.query.trim())}>
        <div class="search-provider-state">
          继续输入查询以使用临时搜索源：
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={/^@\S+\s+/.test(props.query.trim()) && !!props.providerToken}>
        <div class="search-provider-state">
          当前临时搜索源：
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={props.isOpen && props.results.length > 0}>
        <div class="search-suggestions">
          <For each={props.results}>
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
