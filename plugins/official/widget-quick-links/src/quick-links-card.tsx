import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import {
  displayUrl,
  getDefaultLinks,
  initialsFromTitle,
  LINKS_KEY,
  type QuickLink,
} from "./quick-links-data"

export function QuickLinksCard(props: WidgetViewProps) {
  const [links, setLinks] = createSignal<QuickLink[]>([])
  const [query, setQuery] = createSignal("")

  const storageKey = LINKS_KEY
  const showSearch = () => (props.size ?? "M") !== "S"

  const filteredLinks = createMemo(() => {
    const q = query().trim().toLowerCase()
    const all = links()
    if (!q) return all
    return all.filter(
      (link) =>
        link.title.toLowerCase().includes(q) || displayUrl(link.url).toLowerCase().includes(q),
    )
  })

  const visibleLinks = () => {
    const size = props.size ?? "M"
    const matched = filteredLinks()
    // S 尺寸只显示前 4 个
    if (size === "S") return matched.slice(0, 4)
    return matched
  }

  onMount(async () => {
    let saved = await props.data.get<QuickLink[]>(storageKey)
    if (!saved || saved.length === 0) {
      saved = getDefaultLinks(props.config)
      await props.data.save(storageKey, saved)
    }
    setLinks(saved)
  })

  return (
    <div class="quick-links">
      <Show when={showSearch()}>
        <div class="quick-search" role="search">
          <input
            class="quick-search-input"
            type="text"
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder="搜索快捷入口…"
            aria-label="搜索快捷入口"
          />
        </div>
      </Show>
      <ul class="link-grid" aria-label="快捷入口">
        <For each={visibleLinks()}>
          {(link) => (
            <li class="link-item">
              <button
                class="link-anchor"
                type="button"
                onClick={() => void props.host.openExternal(link.url)}
              >
                <span class="link-icon">{initialsFromTitle(link.title)}</span>
                <span class="link-label">{link.title}</span>
              </button>
            </li>
          )}
        </For>
        <Show when={query().trim() && filteredLinks().length === 0}>
          <li class="link-empty">未找到匹配的快捷入口</li>
        </Show>
        <li class="link-item link-add-item">
          <button
            class="link-anchor link-add-anchor"
            type="button"
            onClick={() => props.host.openExpand()}
          >
            <span class="link-add-symbol">+</span>
            <span class="link-label">添加</span>
          </button>
        </li>
      </ul>
    </div>
  )
}
