import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import {
  displayUrl,
  getDefaultLinks,
  initialsFromTitle,
  LINKS_KEY,
  type QuickLink,
} from "./quick-links-data"
import { styles, sx } from "./styles"

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
    <div {...sx(styles.card)} data-quick-links-card>
      <Show when={showSearch()}>
        <div {...sx(styles.search)} role="search">
          <input
            {...sx(styles.searchInput)}
            type="text"
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder="搜索快捷入口…"
            aria-label="搜索快捷入口"
          />
        </div>
      </Show>
      <ul {...sx(styles.grid, props.size === "S" && styles.gridSmall)} aria-label="快捷入口">
        <For each={visibleLinks()}>
          {(link) => (
            <li {...sx(styles.item, props.size === "S" && styles.itemSmall)}>
              <button
                {...sx(styles.link)}
                data-quick-link
                type="button"
                onClick={() => void props.host.openExternal(link.url)}
              >
                <span {...sx(styles.mark)}>{initialsFromTitle(link.title)}</span>
                <span {...sx(styles.label, props.size === "S" && styles.labelHidden)}>
                  {link.title}
                </span>
              </button>
            </li>
          )}
        </For>
        <Show when={query().trim() && filteredLinks().length === 0}>
          <li {...sx(styles.empty)}>未找到匹配的快捷入口</li>
        </Show>
        <li {...sx(styles.item, styles.itemAdd, props.size === "S" && styles.itemSmall)}>
          <button {...sx(styles.link)} type="button" onClick={() => props.host.openExpand()}>
            <span {...sx(styles.addMark)}>+</span>
            <span {...sx(styles.label, props.size === "S" && styles.labelHidden)}>添加</span>
          </button>
        </li>
      </ul>
    </div>
  )
}
