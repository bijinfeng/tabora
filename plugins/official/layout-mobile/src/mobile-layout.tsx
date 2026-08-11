import * as stylex from "@stylexjs/stylex"
import { createMemo, For, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutInstance, LayoutViewProps } from "@tabora/plugin-api/sdk"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api/sdk"
import { Button } from "@tabora/ui/button"
import LayoutGrid from "lucide-solid/icons/layout-grid"
import Plus from "lucide-solid/icons/plus"

import { dateLabel, fallbackText, greeting } from "./i18n"
import { MobileBottomBar } from "./mobile-bottom-bar"
import { styles } from "./styles"

export type LayoutI18n = {
  locale(): string
  t(key: string, vars?: Record<string, string | number>): string
}

export type MobileLayoutProps = LayoutViewProps<JSX.Element> & { i18n?: LayoutI18n }

const mobileGridCellVar = "--mobile-grid-cell"

function countGridColumns(template: string): number {
  const repeatMatch = template.match(/repeat\(\s*(\d+)\s*,/i)
  if (repeatMatch?.[1]) return Number.parseInt(repeatMatch[1], 10)
  return template.split(" ").filter(Boolean).length
}

export function syncMobileGridCellSize(grid: HTMLElement): void {
  const computed = getComputedStyle(grid)
  const columns = countGridColumns(computed.gridTemplateColumns)
  if (columns < 2) {
    grid.style.removeProperty(mobileGridCellVar)
    return
  }

  const gap = Number.parseFloat(computed.columnGap) || 0
  const inner =
    grid.clientWidth -
    (Number.parseFloat(computed.paddingLeft) || 0) -
    (Number.parseFloat(computed.paddingRight) || 0)
  const cell = (inner - gap * (columns - 1)) / columns

  if (cell > 0) {
    grid.style.setProperty(mobileGridCellVar, `${cell}px`)
  }
}

// 计算每页可以容纳的网格单元数
function calculatePageCapacity(containerHeight: number, cellSize: number, gap: number): number {
  // 每页最多显示的行数
  const maxRows = Math.floor((containerHeight + gap) / (cellSize + gap))
  // 4列网格，每页容纳 4 * maxRows 个单元格
  return 4 * maxRows
}

// 将 widget 实例按页分组
function groupInstancesByPage(
  instances: LayoutInstance[],
  pageCapacity: number,
): LayoutInstance[][] {
  if (pageCapacity <= 0 || instances.length === 0) return [instances]

  const pages: LayoutInstance[][] = []
  let currentPage: LayoutInstance[] = []
  let currentPageCells = 0

  for (const instance of instances) {
    // 跳过没有 size 的实例
    if (!instance.size) continue

    const colSpan = widgetGridColumnSpan(instance.size)
    const rowSpan = widgetGridRowSpan(instance.size)
    const cells = colSpan * rowSpan

    // 如果当前页放不下，且当前页不为空，则开始新页
    if (currentPageCells + cells > pageCapacity && currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = []
      currentPageCells = 0
    }

    currentPage.push(instance)
    currentPageCells += cells
  }

  // 添加最后一页
  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return pages.length > 0 ? pages : [[]]
}

export function MobileLayout(props: MobileLayoutProps) {
  let gridRef: HTMLDivElement | undefined
  const i18n = () => props.i18n
  const t = (key: string) => i18n()?.t(key) ?? fallbackText(key)
  const locale = () => i18n()?.locale() ?? "zh-CN"

  const addWidgetAction = () =>
    props.host.getGlobalActions("menu").find((action) => action.id === "add-widget")

  // 获取所有 widget 实例（不再按分组过滤）
  const widgetInstances = (): LayoutInstance[] => {
    const mainGrid = props.regions["mainGrid"]?.instances ?? []
    const focus = props.regions["focus"]?.instances ?? []
    return [...mainGrid, ...focus]
  }

  // 计算分页
  const pages = createMemo(() => {
    const instances = widgetInstances()
    if (instances.length === 0) return [[]]

    // 如果 gridRef 还没有初始化，暂时返回所有实例在一页
    if (!gridRef) return [instances]

    const cellSize = Number.parseFloat(gridRef.style.getPropertyValue(mobileGridCellVar) || "80")
    // 容器高度减去 header、搜索栏、padding 和底部栏
    const containerHeight = window.innerHeight - 180
    const pageCapacity = calculatePageCapacity(containerHeight, cellSize, 12)

    // 如果计算的容量无效，返回所有实例在一页
    if (pageCapacity <= 0) return [instances]

    return groupInstancesByPage(instances, pageCapacity)
  })

  const renderWidget = (instance: LayoutInstance) => {
    const region = props.regions[instance.regionId]
    return region?.renderInstance(instance) ?? null
  }

  const openAddWidget = () => {
    props.host.openAddWidget()
  }

  onMount(() => {
    // 同步网格单元格尺寸
    const sync = () => {
      if (gridRef) syncMobileGridCellSize(gridRef)
    }
    sync()

    const ResizeObserverConstructor = window.ResizeObserver
    const observer = ResizeObserverConstructor ? new ResizeObserverConstructor(sync) : undefined
    if (gridRef) observer?.observe(gridRef)
    window.addEventListener("resize", sync)

    onCleanup(() => {
      observer?.disconnect()
      window.removeEventListener("resize", sync)
    })
  })

  return (
    <main {...stylex.attrs(styles.layout)} data-layout="mobile">
      <div {...stylex.attrs(styles.scrollContainer)}>
        <For each={pages()}>
          {(pageInstances, pageIndex) => (
            <div {...stylex.attrs(styles.page)}>
              <section {...stylex.attrs(styles.content)}>
                <Show when={pageIndex() === 0}>
                  <header {...stylex.attrs(styles.greeting)} data-mobile-greeting>
                    <div {...stylex.attrs(styles.greetingTitle)}>
                      {greeting(t)}{" "}
                      <span {...stylex.attrs(styles.muted)}>· {dateLabel(locale())}</span>
                    </div>
                    <div {...stylex.attrs(styles.greetingActions)}>
                      <Show when={addWidgetAction()}>
                        <Button
                          size="sm"
                          variant="secondary"
                          xstyle={styles.toolbarButton}
                          onClick={openAddWidget}
                        >
                          <Plus size={12} aria-hidden="true" />
                          <span>{t("actions.addWidget")}</span>
                        </Button>
                      </Show>
                    </div>
                  </header>
                  <div {...stylex.attrs(styles.searchStage)}>
                    <Show when={props.regions["topbar"]}>
                      <div {...stylex.attrs(styles.searchInner)}>
                        {props.regions["topbar"]!.render()}
                      </div>
                    </Show>
                  </div>
                </Show>
                <section {...stylex.attrs(styles.grid)}>
                  <div
                    {...stylex.attrs(styles.gridContainer)}
                    data-layout-grid
                    ref={(el) => {
                      if (pageIndex() === 0) gridRef = el
                    }}
                  >
                    <Show
                      when={pageInstances.length > 0}
                      fallback={
                        <Show when={pageIndex() === 0}>
                          <Button
                            size="md"
                            variant="ghost"
                            xstyle={styles.emptyGroup}
                            onClick={openAddWidget}
                          >
                            <div {...stylex.attrs(styles.emptyIcon)}>
                              <LayoutGrid size={32} />
                            </div>
                            <div {...stylex.attrs(styles.emptyText)}>暂无卡片</div>
                            <div {...stylex.attrs(styles.emptyHint)}>{t("grid.empty")}</div>
                          </Button>
                        </Show>
                      }
                    >
                      <For each={pageInstances}>{(instance) => renderWidget(instance)}</For>
                    </Show>
                  </div>
                </section>
              </section>
            </div>
          )}
        </For>
      </div>
      <Show when={pages().length > 1}>
        <div {...stylex.attrs(styles.pageIndicator)} aria-label="页面指示器">
          <For each={pages()}>
            {(_, index) => (
              <div {...stylex.attrs(styles.pageIndicatorDot)} aria-label={`第 ${index() + 1} 页`} />
            )}
          </For>
        </div>
      </Show>
      <MobileBottomBar host={props.host} />
    </main>
  )
}
