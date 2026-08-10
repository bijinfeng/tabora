import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import LayoutGrid from "lucide-solid/icons/layout-grid"
import Plus from "lucide-solid/icons/plus"
import { Button } from "@tabora/ui/button"

import { dateLabel, fallbackText, greeting } from "./i18n"
import { WorkbenchRail } from "./workbench-rail"
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

function countGridColumns(template: string): number {
  const repeatMatch = template.match(/repeat\(\s*(\d+)\s*,/i)
  if (repeatMatch?.[1]) return Number.parseInt(repeatMatch[1], 10)
  return template.split(" ").filter(Boolean).length
}

export function syncDashboardGridCellSize(grid: HTMLElement): void {
  const computed = getComputedStyle(grid)
  const columns = countGridColumns(computed.gridTemplateColumns)
  if (columns < 2) {
    grid.style.removeProperty(dashboardGridCellVar)
    return
  }

  const gap = Number.parseFloat(computed.columnGap) || 0
  const inner =
    grid.clientWidth -
    (Number.parseFloat(computed.paddingLeft) || 0) -
    (Number.parseFloat(computed.paddingRight) || 0)
  const cell = (inner - gap * (columns - 1)) / columns

  if (cell > 0) {
    grid.style.setProperty(dashboardGridCellVar, `${cell}px`)
  }
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

  onMount(() => {
    const sync = () => {
      if (gridRef) syncDashboardGridCellSize(gridRef)
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
    <main {...stylex.attrs(styles.layout)} data-layout="dashboard">
      <WorkbenchRail
        host={props.host}
        groups={groups}
        activeGroupId={activeGroupId}
        setGroups={setPersistedGroups}
        setActiveGroupId={setPersistedActiveGroupId}
      />
      <section {...stylex.attrs(styles.dashboardContent)}>
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
        <div {...stylex.attrs(styles.searchStage)}>
          <Show when={props.regions["topbar"]}>
            <div {...stylex.attrs(styles.searchInner)}>{props.regions["topbar"]!.render()}</div>
          </Show>
        </div>
        <section {...stylex.attrs(styles.grid)}>
          <div
            {...stylex.attrs(styles.gridContainer)}
            ref={(element) => (gridRef = element)}
            data-layout-grid
          >
            <Show when={props.regions["mainGrid"]}>
              {(region) => (
                <Show when={!activeGroup().isDefault} fallback={region().render()}>
                  <Show
                    when={activeMainGridInstances().length > 0}
                    fallback={
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
                          点击 <span {...stylex.attrs(styles.emptyAction)}>添加第一个</span>{" "}
                          开始使用
                        </div>
                      </Button>
                    }
                  >
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
