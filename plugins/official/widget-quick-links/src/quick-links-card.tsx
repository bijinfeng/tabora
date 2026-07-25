import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button } from "@tabora/ui"
import { getDefaultLinks, initialsFromTitle, LINKS_KEY, type QuickLink } from "./quick-links-data"
import { styles } from "./styles"

export function QuickLinksCard(props: WidgetViewProps) {
  const [links, setLinks] = createSignal<QuickLink[]>([])
  const size = () => props.size ?? "M"
  const primary = () => links()[0]
  const remaining = () => links().slice(1)

  onMount(async () => {
    let saved = await props.data.get<QuickLink[]>(LINKS_KEY)
    if (!saved || saved.length === 0) {
      saved = getDefaultLinks(props.config)
      await props.data.save(LINKS_KEY, saved)
    }
    setLinks(saved)
  })

  const open = (link: QuickLink) => void props.host.openExternal(link.url)
  const mark = (link: QuickLink) => initialsFromTitle(link.title)

  const compactLinks = createMemo(() => links().slice(0, 4))

  return (
    <div {...stylex.attrs(styles.card)} data-quick-links-card data-quick-links-variant={size()}>
      <Show
        when={primary()}
        fallback={
          <Button
            size="sm"
            variant="ghost"
            xstyle={styles.emptyAction}
            onClick={() => props.host.openExpand()}
          >
            添加第一个快捷入口
          </Button>
        }
      >
        {(featured) => (
          <Show
            when={size() !== "S"}
            fallback={
              <div {...stylex.attrs(styles.compactGrid)} aria-label="快捷入口">
                <For each={compactLinks()}>
                  {(link) => (
                    <Button
                      size="sm"
                      variant="ghost"
                      xstyle={styles.compactLink}
                      data-quick-link
                      onClick={() => open(link)}
                    >
                      {mark(link)}
                    </Button>
                  )}
                </For>
              </div>
            }
          >
            <Show when={size() === "M"}>
              <div {...stylex.attrs(styles.medium)}>
                <Button
                  size="sm"
                  variant="ghost"
                  xstyle={styles.primaryLink}
                  data-quick-link
                  onClick={() => open(featured())}
                >
                  <span {...stylex.attrs(styles.primaryMark)}>{mark(featured())}</span>
                  <span {...stylex.attrs(styles.primaryCopy)}>
                    <strong>{featured().title}</strong>
                    <small>OPEN ↗</small>
                  </span>
                </Button>
                <div {...stylex.attrs(styles.mediumRail)}>
                  <For each={remaining().slice(0, 3)}>
                    {(link) => (
                      <Button
                        size="sm"
                        variant="ghost"
                        xstyle={styles.railLink}
                        aria-label={link.title}
                        onClick={() => open(link)}
                      >
                        {mark(link)}
                      </Button>
                    )}
                  </For>
                  <Button
                    size="sm"
                    variant="ghost"
                    xstyle={[styles.railLink, styles.addLink]}
                    onClick={() => props.host.openExpand()}
                  >
                    +
                  </Button>
                </div>
              </div>
            </Show>

            <Show when={size() === "L"}>
              <div {...stylex.attrs(styles.large)}>
                <span {...stylex.attrs(styles.kicker)}>Link constellation</span>
                <Button
                  size="sm"
                  variant="ghost"
                  xstyle={styles.constellationCore}
                  data-quick-link
                  onClick={() => open(featured())}
                >
                  <strong>{mark(featured())}</strong>
                  <span>{featured().title}</span>
                </Button>
                <For each={remaining().slice(0, 4)}>
                  {(link, index) => (
                    <Button
                      size="sm"
                      variant="ghost"
                      xstyle={[
                        styles.constellationNode,
                        [
                          styles.constellationOne,
                          styles.constellationTwo,
                          styles.constellationThree,
                          styles.constellationFour,
                        ][index()]!,
                      ]}
                      aria-label={link.title}
                      onClick={() => open(link)}
                    >
                      {mark(link)}
                    </Button>
                  )}
                </For>
                <Button
                  size="sm"
                  variant="ghost"
                  xstyle={[styles.constellationNode, styles.constellationAdd]}
                  onClick={() => props.host.openExpand()}
                >
                  +
                </Button>
              </div>
            </Show>

            <Show when={size() === "XL"}>
              <div {...stylex.attrs(styles.extraLarge)}>
                <Button
                  size="sm"
                  variant="ghost"
                  xstyle={styles.stage}
                  data-quick-link
                  onClick={() => open(featured())}
                >
                  <span {...stylex.attrs(styles.kicker)}>Primary workspace</span>
                  <span {...stylex.attrs(styles.stagePrimary)}>
                    <span {...stylex.attrs(styles.stageMark)}>{mark(featured())}</span>
                    <span>
                      <strong>{featured().title}</strong>
                      <small>继续上次工作</small>
                    </span>
                  </span>
                </Button>
                <div {...stylex.attrs(styles.board)}>
                  <div {...stylex.attrs(styles.boardHead)}>
                    <strong>快捷工作区</strong>
                    <span>{links().length} 个入口</span>
                  </div>
                  <For each={remaining().slice(0, 4)}>
                    {(link) => (
                      <Button
                        size="sm"
                        variant="ghost"
                        xstyle={styles.tile}
                        aria-label={link.title}
                        onClick={() => open(link)}
                      >
                        <span {...stylex.attrs(styles.tileMark)}>{mark(link)}</span>
                        <span {...stylex.attrs(styles.tileCopy)}>
                          <strong>{link.title}</strong>
                          <small>最近访问</small>
                        </span>
                        <span>↗</span>
                      </Button>
                    )}
                  </For>
                  <Button
                    size="sm"
                    variant="ghost"
                    xstyle={[styles.tile, styles.addTile]}
                    onClick={() => props.host.openExpand()}
                  >
                    <span {...stylex.attrs(styles.tileMark)}>+</span>
                    <span {...stylex.attrs(styles.tileCopy)}>
                      <strong>添加入口</strong>
                      <small>链接或命令</small>
                    </span>
                  </Button>
                </div>
              </div>
            </Show>
          </Show>
        )}
      </Show>
    </div>
  )
}
