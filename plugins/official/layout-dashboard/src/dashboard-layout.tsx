import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { LayoutGrid } from "lucide-solid"
import { Button } from "@tabora/ui"

import { dateLabel, fallbackText, greeting } from "./i18n"
import { WorkbenchRail } from "./workbench-rail"
import { normalizeDashboardLayoutState, resolveSetterValue } from "./dashboard-layout-state"
import { styles } from "./styles"
import type {
  ActiveGroupSetter,
  DashboardLayoutState,
  LayoutViewPropsWithI18n,
  RailGroup,
  RailGroupSetter,
} from "./types"

const dashboardLayoutStateKey = "official.layout.workbench-dashboard.groups"

export function DashboardLayout(props: LayoutViewPropsWithI18n<JSX.Element>) {
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
    icon: "◐",
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
        <header {...stylex.attrs(styles.dashboardTopbar)}>
          <div {...stylex.attrs(styles.greeting)}>
            <div {...stylex.attrs(styles.greetingTitle)}>
              {greeting(t)} <span {...stylex.attrs(styles.muted)}>· {dateLabel(locale())}</span>
            </div>
            <div {...stylex.attrs(styles.greetingActions)}>
              <Show when={addWidgetAction()}>
                <Button
                  size="sm"
                  variant="secondary"
                  xstyle={styles.toolbarButton}
                  onClick={openAddWidgetForActiveGroup}
                >
                  <span>{t("actions.addWidget")}</span>
                </Button>
              </Show>
            </div>
          </div>
          <div {...stylex.attrs(styles.searchStage)}>
            <Show when={props.regions["topbar"]}>
              <div {...stylex.attrs(styles.searchInner)}>{props.regions["topbar"]!.render()}</div>
            </Show>
          </div>
        </header>
        <section {...stylex.attrs(styles.grid)}>
          <div {...stylex.attrs(styles.gridContainer)} data-layout-grid>
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
