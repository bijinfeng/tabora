import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onMount, Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button } from "@tabora/ui"
import { ArrowUpRight, Plus } from "lucide-solid"
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

  // S 的星座位置由设计稿固定为四个，多出的入口在小卡上不展示
  const compactLinks = createMemo(() => remaining().slice(0, 3))
  const smallNodeStyles = [styles.smallOne, styles.smallTwo, styles.smallThree] as const

  // L 的轨道有五个槽位：填满则不再显示添加按钮，未填满时添加按钮占下一个空槽
  const orbitStyles = [
    styles.constellationOne,
    styles.constellationTwo,
    styles.constellationThree,
    styles.constellationFour,
    styles.constellationFive,
  ] as const
  const orbitLinks = createMemo(() => remaining().slice(0, orbitStyles.length))

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
              <div {...stylex.attrs(styles.small)} aria-label="快捷入口">
                <div {...stylex.attrs(styles.smallTitle)}>快捷入口</div>
                <span {...stylex.attrs(styles.smallLine, styles.smallLineA)} aria-hidden="true" />
                <span {...stylex.attrs(styles.smallLine, styles.smallLineB)} aria-hidden="true" />
                <span {...stylex.attrs(styles.smallLine, styles.smallLineC)} aria-hidden="true" />
                <button
                  {...stylex.attrs(styles.hit, styles.smallNode, styles.smallPrimary)}
                  type="button"
                  data-quick-link
                  aria-label={featured().title}
                  onClick={() => open(featured())}
                >
                  {mark(featured())}
                </button>
                <For each={compactLinks()}>
                  {(link, index) => (
                    <button
                      {...stylex.attrs(styles.hit, styles.smallNode, smallNodeStyles[index()]!)}
                      type="button"
                      data-quick-link
                      aria-label={link.title}
                      onClick={() => open(link)}
                    >
                      {mark(link)}
                    </button>
                  )}
                </For>
                <button
                  {...stylex.attrs(styles.hit, styles.smallNode, styles.smallFour, styles.smallAdd)}
                  type="button"
                  aria-label="添加入口"
                  onClick={() => props.host.openExpand()}
                >
                  <Plus size={12} />
                </button>
              </div>
            }
          >
            <Show when={size() === "M"}>
              <div {...stylex.attrs(styles.medium)}>
                <button
                  {...stylex.attrs(styles.hit, styles.primaryLink)}
                  type="button"
                  data-quick-link
                  onClick={() => open(featured())}
                >
                  <span {...stylex.attrs(styles.primaryMark)}>{mark(featured())}</span>
                  <span {...stylex.attrs(styles.primaryArrow)} aria-hidden="true">
                    <ArrowUpRight size={12} />
                  </span>
                  <span {...stylex.attrs(styles.primaryCopy)}>
                    <strong {...stylex.attrs(styles.primaryTitle)}>{featured().title}</strong>
                    <span {...stylex.attrs(styles.primaryHint)}>OPEN</span>
                  </span>
                </button>
                <div {...stylex.attrs(styles.mediumRail)}>
                  <For each={remaining().slice(0, 3)}>
                    {(link) => (
                      <button
                        {...stylex.attrs(styles.hit, styles.railLink)}
                        type="button"
                        data-quick-link
                        aria-label={link.title}
                        onClick={() => open(link)}
                      >
                        {mark(link)}
                      </button>
                    )}
                  </For>
                  <button
                    {...stylex.attrs(styles.hit, styles.railLink, styles.addLink)}
                    type="button"
                    aria-label="添加入口"
                    onClick={() => props.host.openExpand()}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </Show>

            <Show when={size() === "L"}>
              <div {...stylex.attrs(styles.large)}>
                <span {...stylex.attrs(styles.kicker, styles.largeKicker)}>Link constellation</span>
                <button
                  {...stylex.attrs(styles.hit, styles.constellationCore)}
                  type="button"
                  data-quick-link
                  onClick={() => open(featured())}
                >
                  <strong {...stylex.attrs(styles.coreMark)}>{mark(featured())}</strong>
                  <span {...stylex.attrs(styles.coreTitle)}>{featured().title}</span>
                </button>
                <For each={orbitLinks()}>
                  {(link, index) => (
                    <button
                      {...stylex.attrs(styles.hit, styles.constellationNode, orbitStyles[index()]!)}
                      type="button"
                      data-quick-link
                      aria-label={link.title}
                      onClick={() => open(link)}
                    >
                      {mark(link)}
                    </button>
                  )}
                </For>
                <Show when={orbitLinks().length < orbitStyles.length}>
                  <button
                    {...stylex.attrs(
                      styles.hit,
                      styles.constellationNode,
                      orbitStyles[orbitLinks().length]!,
                      styles.constellationAdd,
                    )}
                    type="button"
                    aria-label="添加入口"
                    onClick={() => props.host.openExpand()}
                  >
                    <Plus size={12} />
                  </button>
                </Show>
              </div>
            </Show>

            <Show when={size() === "XL"}>
              <div {...stylex.attrs(styles.extraLarge)}>
                <button
                  {...stylex.attrs(styles.hit, styles.stage)}
                  type="button"
                  data-quick-link
                  onClick={() => open(featured())}
                >
                  <span {...stylex.attrs(styles.kicker)}>Primary workspace</span>
                  <span {...stylex.attrs(styles.stageRing)} aria-hidden="true" />
                  <span {...stylex.attrs(styles.stagePrimary)}>
                    <span {...stylex.attrs(styles.stageMark)}>{mark(featured())}</span>
                    <span {...stylex.attrs(styles.stageCopy)}>
                      <strong {...stylex.attrs(styles.stageTitle)}>{featured().title}</strong>
                      <span {...stylex.attrs(styles.stageHint)}>继续上次工作</span>
                    </span>
                  </span>
                </button>
                <div {...stylex.attrs(styles.board)}>
                  <div {...stylex.attrs(styles.boardHead)}>
                    <strong>快捷工作区</strong>
                    <span {...stylex.attrs(styles.boardCount)}>{links().length} 个入口</span>
                  </div>
                  <For each={remaining().slice(0, 4)}>
                    {(link, index) => (
                      <button
                        {...stylex.attrs(styles.hit, styles.tile)}
                        type="button"
                        data-quick-link
                        aria-label={link.title}
                        onClick={() => open(link)}
                      >
                        <span {...stylex.attrs(styles.tileMark)}>{mark(link)}</span>
                        <span {...stylex.attrs(styles.tileCopy)}>
                          <strong {...stylex.attrs(styles.tileTitle)}>{link.title}</strong>
                          <span {...stylex.attrs(styles.tileHint)}>
                            {index() < 2 ? "工作空间" : "最近访问"}
                          </span>
                        </span>
                        <span {...stylex.attrs(styles.tileArrow)} aria-hidden="true">
                          <ArrowUpRight size={12} />
                        </span>
                      </button>
                    )}
                  </For>
                  <button
                    {...stylex.attrs(styles.hit, styles.tile, styles.addTile)}
                    type="button"
                    onClick={() => props.host.openExpand()}
                  >
                    <span {...stylex.attrs(styles.tileMark)}>
                      <Plus size={14} />
                    </span>
                    <span {...stylex.attrs(styles.tileCopy)}>
                      <strong {...stylex.attrs(styles.tileTitle)}>添加入口</strong>
                      <span {...stylex.attrs(styles.tileHint)}>链接或命令</span>
                    </span>
                    <span {...stylex.attrs(styles.tileArrow)} aria-hidden="true">
                      <Plus size={12} />
                    </span>
                  </button>
                </div>
              </div>
            </Show>
          </Show>
        )}
      </Show>
    </div>
  )
}
