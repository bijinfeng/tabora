import { createMemo, createSignal, For, Show } from "solid-js"
import { Kbd } from "@tabora/ui"

export type CommandItem = {
  icon: string
  name: string
  desc: string
  group: "命令" | "卡片" | "搜索"
  shortcut?: string
  action: () => void
}

export type CommandPaletteProps = {
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
}

export function CommandPalette(props: CommandPaletteProps) {
  const [query, setQuery] = createSignal("")
  const [activeIdx, setActiveIdx] = createSignal(0)

  const filtered = createMemo(() => {
    const q = query().toLowerCase().trim()
    if (!q) return []
    return props.commands.filter(
      (c) => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q),
    )
  })

  const grouped = createMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    for (const item of filtered()) {
      const g = groups[item.group] ?? (groups[item.group] = [])
      g.push(item)
    }
    return groups
  })

  let flatIdx = 0
  const flatMap = createMemo(() => {
    const map: number[] = []
    flatIdx = 0
    for (const items of Object.values(grouped())) {
      for (let i = 0; i < items.length; i++) map.push(flatIdx++)
    }
    return map
  })

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filtered().length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      filtered()[activeIdx()]?.action()
      close()
    } else if (e.key === "Escape") {
      close()
    }
  }

  function close() {
    setQuery("")
    setActiveIdx(0)
    props.onClose()
  }

  const favorites: CommandItem[] = props.commands.filter((c) => c.group === "命令").slice(0, 4)

  return (
    <Show when={props.isOpen}>
      <div class="cmd-overlay" onClick={close}>
        <div class="cmd-panel" onClick={(e) => e.stopPropagation()}>
          <div class="cmd-input-wrap">
            <svg
              class="cmd-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              class="cmd-input"
              type="text"
              value={query()}
              placeholder="搜索命令、卡片、网页..."
              autofocus
              onInput={(e) => {
                setQuery(e.currentTarget.value)
                setActiveIdx(0)
              }}
              onKeyDown={handleKeyDown}
            />
            <span class="cmd-esc">
              <Kbd>esc</Kbd>
            </span>
          </div>
          <div class="cmd-results">
            <Show
              when={query().length === 0}
              fallback={
                <Show
                  when={filtered().length > 0}
                  fallback={<div class="cmd-empty">未找到匹配结果</div>}
                >
                  <For each={Object.entries(grouped())}>
                    {([group, items]) => (
                      <>
                        <div class="cmd-group">{group}</div>
                        <For each={items}>
                          {(item) => {
                            const i = filtered().indexOf(item)
                            return (
                              <button
                                class="cmd-item"
                                classList={{ active: i === activeIdx() }}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  item.action()
                                  close()
                                }}
                              >
                                <span class="cmd-item-icon">{item.icon}</span>
                                <span class="cmd-item-text">
                                  <span class="cmd-item-name">{item.name}</span>
                                  <span class="cmd-item-desc">{item.desc}</span>
                                </span>
                                <Show when={item.shortcut}>
                                  <Kbd>{item.shortcut!}</Kbd>
                                </Show>
                              </button>
                            )
                          }}
                        </For>
                      </>
                    )}
                  </For>
                </Show>
              }
            >
              <div class="cmd-group">收藏</div>
              <For each={favorites}>
                {(item) => (
                  <button
                    class="cmd-item"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      item.action()
                      close()
                    }}
                  >
                    <span class="cmd-item-icon">{item.icon}</span>
                    <span class="cmd-item-text">
                      <span class="cmd-item-name">{item.name}</span>
                      <span class="cmd-item-desc">{item.desc}</span>
                    </span>
                    <Show when={item.shortcut}>
                      <Kbd>{item.shortcut!}</Kbd>
                    </Show>
                  </button>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
}
