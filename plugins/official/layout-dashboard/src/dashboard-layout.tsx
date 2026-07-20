import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { LayoutGrid } from "lucide-solid"

import { dateLabel, fallbackText, greeting } from "./i18n"
import { WorkbenchRail } from "./workbench-rail"
import { normalizeDashboardLayoutState, resolveSetterValue } from "./dashboard-layout-state"
import { styles, sx } from "./styles"
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
    <main {...sx(styles.layout)} data-layout="dashboard">
      <WorkbenchRail
        host={props.host}
        groups={groups}
        activeGroupId={activeGroupId}
        setGroups={setPersistedGroups}
        setActiveGroupId={setPersistedActiveGroupId}
      />
      <section {...sx(styles.dashboardContent)}>
        <header {...sx(styles.dashboardTopbar)}>
          <div {...sx(styles.greeting)}>
            <div {...sx(styles.greetingTitle)}>
              {greeting(t)} <span {...sx(styles.muted)}>· {dateLabel(locale())}</span>
            </div>
            <div {...sx(styles.greetingActions)}>
              <Show when={addWidgetAction()}>
                <button
                  {...sx(styles.toolbarButton)}
                  type="button"
                  onClick={openAddWidgetForActiveGroup}
                >
                  <span>{t("actions.addWidget")}</span>
                </button>
              </Show>
            </div>
          </div>
          <div {...sx(styles.searchStage)}>
            <Show when={props.regions["topbar"]}>
              <div {...sx(styles.searchInner)}>{props.regions["topbar"]!.render()}</div>
            </Show>
          </div>
        </header>
        <section {...sx(styles.grid)}>
          <div {...sx(styles.gridContainer)} data-layout-grid>
            <Show when={props.regions["mainGrid"]}>
              {(region) => (
                <Show when={!activeGroup().isDefault} fallback={region().render()}>
                  <Show
                    when={activeMainGridInstances().length > 0}
                    fallback={
                      <button
                        {...sx(styles.emptyGroup)}
                        type="button"
                        onClick={openAddWidgetForActiveGroup}
                      >
                        <div {...sx(styles.emptyIcon)}>
                          <LayoutGrid size={32} />
                        </div>
                        <div {...sx(styles.emptyText)}>暂无卡片</div>
                        <div {...sx(styles.emptyHint)}>
                          点击 <span {...sx(styles.emptyAction)}>添加第一个</span> 开始使用
                        </div>
                      </button>
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
