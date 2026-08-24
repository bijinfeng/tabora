import * as stylex from "@stylexjs/stylex"
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import LayoutGrid from "lucide-solid/icons/layout-grid"
import Plus from "lucide-solid/icons/plus"
import type { LayoutInstance } from "@tabora/plugin-api/sdk"
import { widgetGridColumnSpan, widgetGridRowSpan } from "@tabora/plugin-api/sdk"
import { Button, IconButton } from "@tabora/ui/button"

import { dateLabel, fallbackText, greeting } from "./i18n"
import { WorkbenchRail } from "./workbench-rail"
import { HostActionIcon } from "./host-action-icon"
import {
  dashboardLayoutStateKey,
  normalizeDashboardLayoutState,
  resolveSetterValue,
} from "./dashboard-layout-state"
import { styles } from "./styles"
import type {
  ActiveGroupSetter,
  DashboardLayoutState,
  LayoutViewPropsWithI18n,
  RailGroup,
  RailGroupSetter,
} from "./types"

const dashboardGridCellVar = "--dashboard-grid-cell"
const mobileGridCellVar = "--mobile-grid-cell"
const mobileGridColumns = 4

function countGridColumns(template: string): number {
  const repeatMatch = template.match(/repeat\(\s*(\d+)\s*,/i)
  if (repeatMatch?.[1]) return Number.parseInt(repeatMatch[1], 10)
  return template.split(" ").filter(Boolean).length
}

function syncGridCellSize(grid: HTMLElement, variable: string): void {
  const computed = getComputedStyle(grid)
  const columns = countGridColumns(computed.gridTemplateColumns)
  if (columns < 2) {
    grid.style.removeProperty(variable)
    return
  }

  const gap = Number.parseFloat(computed.columnGap) || 0
  const inner =
    grid.clientWidth -
    (Number.parseFloat(computed.paddingLeft) || 0) -
    (Number.parseFloat(computed.paddingRight) || 0)
  const cell = (inner - gap * (columns - 1)) / columns

  if (cell > 0) {
    grid.style.setProperty(variable, `${cell}px`)
  }
}

export function syncDashboardGridCellSize(grid: HTMLElement): void {
  syncGridCellSize(grid, dashboardGridCellVar)
}

export function syncMobileGridCellSize(grid: HTMLElement): void {
  syncGridCellSize(grid, mobileGridCellVar)
}

// Mobile pagination: how many grid cells fit on a single scroll-snap page.
function calculatePageCapacity(containerHeight: number, cellSize: number, gap: number): number {
  const maxRows = Math.floor((containerHeight + gap) / (cellSize + gap))
  return mobileGridColumns * maxRows
}

function groupInstancesByPage(
  instances: LayoutInstance[],
  pageCapacity: number,
): LayoutInstance[][] {
  if (pageCapacity <= 0 || instances.length === 0) return [instances]

  const pages: LayoutInstance[][] = []
  let currentPage: LayoutInstance[] = []
  let currentPageCells = 0

  for (const instance of instances) {
    if (!instance.size) continue

    const cells = widgetGridColumnSpan(instance.size) * widgetGridRowSpan(instance.size)

    if (currentPageCells + cells > pageCapacity && currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = []
      currentPageCells = 0
    }

    currentPage.push(instance)
    currentPageCells += cells
  }

  if (currentPage.length > 0) {
    pages.push(currentPage)
  }

  return pages.length > 0 ? pages : [[]]
}

function MobileBottomBar(props: LayoutViewPropsWithI18n<JSX.Element>) {
  const utilityActions = () =>
    props.host
      .getGlobalActions("rail")
      .filter((action) => ["add-widget", "theme", "settings"].includes(action.id))

  return (
    <nav {...stylex.attrs(styles.mobileBar)} data-workbench-mobile-bar aria-label="工作台导航">
      <For each={utilityActions()}>
        {(action) => (
          <IconButton
            size="md"
            xstyle={[styles.mobileBarButton, action.isActive && styles.mobileBarButtonActive]}
            aria-label={action.label}
            title={action.label}
            onClick={() => action.run()}
          >
            <HostActionIcon id={action.id} icon={action.icon} />
          </IconButton>
        )}
      </For>
    </nav>
  )
}

export function DashboardLayout(props: LayoutViewPropsWithI18n<JSX.Element>) {
  let gridRef: HTMLDivElement | undefined
  const i18n = () => props.i18n
  const t = (key: string) => i18n()?.t(key) ?? fallbackText(key)
  const locale = () => i18n()?.locale() ?? "zh-CN"
  const addWidgetAction = () =>
    props.host.getGlobalActions("menu").find((action) => action.id === "add-widget")
  const homeAction = () =>
    props.host.getGlobalActions("rail").find((action) => action.id === "home")
  const defaultGroup = (): RailGroup => ({
    id: "default",
    name: homeAction()?.label.replace(/^分组\s*/, "") || "我的工作台",
    icon: "circle-dot",
    isDefault: true,
    widgets: [],
  })
  const initialState = normalizeDashboardLayoutState(
    props.host.readLayoutState<DashboardLayoutState>(dashboardLayoutStateKey),
    defaultGroup(),
  )
  const [groups, setGroups] = createSignal<RailGroup[]>(initialState.groups)
  const [activeGroupId, setActiveGroupId] = createSignal(initialState.activeGroupId)
  const persistDashboardState = (nextGroups: RailGroup[], nextActiveGroupId: string) => {
    props.host.writeLayoutState(dashboardLayoutStateKey, {
      groups: nextGroups,
      activeGroupId: nextActiveGroupId,
    } satisfies DashboardLayoutState)
  }
  const setPersistedGroups: RailGroupSetter = (value) => {
    const next = resolveSetterValue(groups(), value)
    setGroups(next)
    persistDashboardState(next, activeGroupId())
    return next
  }
  const setPersistedActiveGroupId: ActiveGroupSetter = (value) => {
    const next = resolveSetterValue(activeGroupId(), value)
    setActiveGroupId(next)
    persistDashboardState(groups(), next)
    return next
  }
  // The host remounts this view whenever displayed instances change, and workspace
  // writes land asynchronously. Re-read persisted state reactively so a remount that
  // races ahead of an in-flight write still converges on the stored groups/active id
  // instead of freezing a stale mount-time snapshot.
  createEffect(() => {
    const persisted = normalizeDashboardLayoutState(
      props.host.readLayoutState<DashboardLayoutState>(dashboardLayoutStateKey),
      defaultGroup(),
    )
    setGroups(persisted.groups)
    setActiveGroupId(persisted.activeGroupId)
  })
  const activeGroup = createMemo(
    () => groups().find((group) => group.id === activeGroupId()) ?? groups()[0] ?? defaultGroup(),
  )
  const activeMainGridInstances = createMemo(() => {
    const group = activeGroup()
    const region = props.regions["mainGrid"]
    if (!region || group.isDefault) return region?.instances ?? []

    const allowed = new Set(group.widgets)
    return region.instances.filter((instance) => allowed.has(instance.id))
  })
  const openAddWidgetForActiveGroup = () => {
    const group = activeGroup()
    props.host.openAddWidget({
      activeGroupLabel: group.name,
      onAdded: (instance) => {
        if (group.isDefault) return
        setPersistedGroups((items) =>
          items.map((item) =>
            item.id === group.id && !item.widgets.includes(instance.id)
              ? { ...item, widgets: [...item.widgets, instance.id] }
              : item,
          ),
        )
      },
    })
  }

  // Mobile pages the same widget instances the active group would show, using
  // scroll-snap paging instead of the desktop rail + single grid.
  const mobilePages = createMemo<LayoutInstance[][]>(() => {
    const instances = activeMainGridInstances()
    if (instances.length === 0) return [[]]
    if (!gridRef) return [instances]

    const cellSize = Number.parseFloat(gridRef.style.getPropertyValue(mobileGridCellVar) || "80")
    const containerHeight = window.innerHeight - 180
    const pageCapacity = calculatePageCapacity(containerHeight, cellSize, 12)
    if (pageCapacity <= 0) return [instances]

    return groupInstancesByPage(instances, pageCapacity)
  })

  onMount(() => {
    const sync = () => {
      if (!gridRef) return
      if (props.isMobile) syncMobileGridCellSize(gridRef)
      else syncDashboardGridCellSize(gridRef)
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

  const renderGreeting = () => (
    <header {...stylex.attrs(styles.greeting)} data-dashboard-greeting>
      <div {...stylex.attrs(styles.greetingTitle)}>
        {greeting(t)} <span {...stylex.attrs(styles.muted)}>· {dateLabel(locale())}</span>
      </div>
      <div {...stylex.attrs(styles.greetingActions)} data-dashboard-greeting-actions>
        <Show when={addWidgetAction()}>
          <Button
            size="sm"
            variant="secondary"
            xstyle={styles.toolbarButton}
            onClick={openAddWidgetForActiveGroup}
          >
            <Plus size={12} aria-hidden="true" />
            <span>{t("actions.addWidget")}</span>
          </Button>
        </Show>
      </div>
    </header>
  )

  const renderSearchStage = () => (
    <div {...stylex.attrs(styles.searchStage)}>
      <Show when={props.regions["topbar"]}>
        <div {...stylex.attrs(styles.searchInner)}>{props.regions["topbar"]!.render()}</div>
      </Show>
    </div>
  )

  const renderEmpty = () => (
    <Button
      size="md"
      variant="ghost"
      xstyle={styles.emptyGroup}
      onClick={openAddWidgetForActiveGroup}
    >
      <div {...stylex.attrs(styles.emptyIcon)}>
        <LayoutGrid size={32} />
      </div>
      <div {...stylex.attrs(styles.emptyText)}>暂无卡片</div>
      <div {...stylex.attrs(styles.emptyHint)}>
        点击 <span {...stylex.attrs(styles.emptyAction)}>添加第一个</span> 开始使用
      </div>
    </Button>
  )

  if (props.isMobile) {
    const region = () => props.regions["mainGrid"]
    return (
      <main {...stylex.attrs(styles.mobileLayout)} data-layout="dashboard" data-mobile>
        <div {...stylex.attrs(styles.mobileScrollContainer)}>
          <For each={mobilePages()}>
            {(pageInstances, pageIndex) => (
              <div {...stylex.attrs(styles.mobilePage)}>
                <section {...stylex.attrs(styles.mobileContent)}>
                  <Show when={pageIndex() === 0}>
                    {renderGreeting()}
                    {renderSearchStage()}
                  </Show>
                  <section {...stylex.attrs(styles.grid)}>
                    <div
                      {...stylex.attrs(styles.mobileGridContainer)}
                      data-layout-grid
                      ref={(element) => {
                        if (pageIndex() === 0) gridRef = element
                      }}
                    >
                      <Show
                        when={pageInstances.length > 0}
                        fallback={<Show when={pageIndex() === 0}>{renderEmpty()}</Show>}
                      >
                        <For each={pageInstances}>
                          {(instance) => region()?.renderInstance(instance)}
                        </For>
                      </Show>
                    </div>
                  </section>
                </section>
              </div>
            )}
          </For>
        </div>
        <Show when={mobilePages().length > 1}>
          <div {...stylex.attrs(styles.pageIndicator)} aria-label="页面指示器">
            <For each={mobilePages()}>
              {(_, index) => (
                <div
                  {...stylex.attrs(styles.pageIndicatorDot)}
                  aria-label={`第 ${index() + 1} 页`}
                />
              )}
            </For>
          </div>
        </Show>
        <MobileBottomBar {...props} />
      </main>
    )
  }

  return (
    <main {...stylex.attrs(styles.layout)} data-layout="dashboard">
      <WorkbenchRail
        host={props.host}
        groups={groups}
        activeGroupId={activeGroupId}
        setGroups={setPersistedGroups}
        setActiveGroupId={setPersistedActiveGroupId}
      />
      <section {...stylex.attrs(styles.dashboardContent)}>
        {renderGreeting()}
        {renderSearchStage()}
        <section {...stylex.attrs(styles.grid)}>
          <div
            {...stylex.attrs(styles.gridContainer)}
            ref={(element) => (gridRef = element)}
            data-layout-grid
          >
            <Show when={props.regions["mainGrid"]}>
              {(region) => (
                <Show when={!activeGroup().isDefault} fallback={region().render()}>
                  <Show when={activeMainGridInstances().length > 0} fallback={renderEmpty()}>
                    <For each={activeMainGridInstances()}>
                      {(instance) => region().renderInstance(instance)}
                    </For>
                  </Show>
                </Show>
              )}
            </Show>
          </div>
        </section>
      </section>
    </main>
  )
}
