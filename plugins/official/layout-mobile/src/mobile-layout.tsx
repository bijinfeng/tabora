import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutInstance, LayoutViewProps } from "@tabora/plugin-api/sdk"
import {
  dashboardLayoutStateKey,
  normalizeDashboardLayoutState,
  resolveSetterValue,
} from "@tabora/layout-dashboard/state"
import type {
  ActiveGroupSetter,
  DashboardLayoutState,
  RailGroup,
  RailGroupSetter,
} from "@tabora/layout-dashboard/state"
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

export function MobileLayout(props: MobileLayoutProps & { onNavigateToSettings?: () => void }) {
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
  const persistState = (nextGroups: RailGroup[], nextActiveGroupId: string) => {
    props.host.writeLayoutState(dashboardLayoutStateKey, {
      groups: nextGroups,
      activeGroupId: nextActiveGroupId,
    } satisfies DashboardLayoutState)
  }
  const setPersistedGroups: RailGroupSetter = (value) => {
    const next = resolveSetterValue(groups(), value)
    setGroups(next)
    persistState(next, activeGroupId())
    return next
  }
  const setPersistedActiveGroupId: ActiveGroupSetter = (value) => {
    const next = resolveSetterValue(activeGroupId(), value)
    setActiveGroupId(next)
    persistState(groups(), next)
    return next
  }

  const activeGroup = createMemo(
    () => groups().find((group) => group.id === activeGroupId()) ?? groups()[0] ?? defaultGroup(),
  )

  const widgetInstances = createMemo<LayoutInstance[]>(() => {
    const mainGrid = props.regions["mainGrid"]?.instances ?? []
    const focus = props.regions["focus"]?.instances ?? []
    const combined = [...mainGrid, ...focus]
    const group = activeGroup()
    if (group.isDefault) return combined
    const allowed = new Set(group.widgets)
    return combined.filter((instance) => allowed.has(instance.id))
  })

  const renderWidget = (instance: LayoutInstance) => {
    const region = props.regions[instance.regionId]
    return region?.renderInstance(instance) ?? null
  }

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

  // 水平滑动切换分组
  let contentRef: HTMLElement | undefined
  let swipeStartX = 0
  let swipeStartY = 0
  let swipeStartTime = 0

  const handlePointerDown = (event: PointerEvent) => {
    swipeStartX = event.clientX
    swipeStartY = event.clientY
    swipeStartTime = Date.now()
  }

  const handlePointerUp = (event: PointerEvent) => {
    const deltaX = event.clientX - swipeStartX
    const deltaY = event.clientY - swipeStartY
    const deltaTime = Date.now() - swipeStartTime

    // 水平滑动距离大于垂直、时间不超过 500ms、水平距离超过 80px 才触发
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 500 && Math.abs(deltaX) > 80) {
      const currentGroups = groups()
      const currentIndex = currentGroups.findIndex((g) => g.id === activeGroupId())
      if (currentIndex === -1) return

      let nextIndex: number
      if (deltaX > 0) {
        // 向右滑动，切换到上一个分组
        nextIndex = currentIndex === 0 ? currentGroups.length - 1 : currentIndex - 1
      } else {
        // 向左滑动，切换到下一个分组
        nextIndex = currentIndex === currentGroups.length - 1 ? 0 : currentIndex + 1
      }

      const nextGroup = currentGroups[nextIndex]
      if (nextGroup) {
        setPersistedActiveGroupId(nextGroup.id)
        if (nextGroup.id === "default") homeAction()?.run()
        props.host.showToast(`已切换到「${nextGroup.name}」`, { type: "success" })
      }
    }
  }

  onMount(() => {
    if (contentRef) {
      contentRef.addEventListener("pointerdown", handlePointerDown)
      contentRef.addEventListener("pointerup", handlePointerUp)
      onCleanup(() => {
        contentRef?.removeEventListener("pointerdown", handlePointerDown)
        contentRef?.removeEventListener("pointerup", handlePointerUp)
      })
    }
  })

  return (
    <main {...stylex.attrs(styles.layout)} data-layout="mobile">
      <section
        {...stylex.attrs(styles.content)}
        ref={(el) => {
          contentRef = el
        }}
      >
        <header {...stylex.attrs(styles.greeting)} data-mobile-greeting>
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
          <div {...stylex.attrs(styles.gridContainer)} data-layout-grid>
            <Show
              when={widgetInstances().length > 0}
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
                  <div {...stylex.attrs(styles.emptyHint)}>{t("grid.empty")}</div>
                </Button>
              }
            >
              <For each={widgetInstances()}>{(instance) => renderWidget(instance)}</For>
            </Show>
          </div>
        </section>
      </section>
      <Show when={groups().length > 1}>
        <div {...stylex.attrs(styles.pageIndicator)} aria-label="分组指示器">
          <For each={groups()}>
            {(group) => (
              <div
                {...stylex.attrs(
                  styles.pageIndicatorDot,
                  group.id === activeGroupId() && styles.pageIndicatorDotActive,
                )}
                aria-label={group.name}
                aria-current={group.id === activeGroupId() ? "true" : undefined}
              />
            )}
          </For>
        </div>
      </Show>
      <MobileBottomBar
        host={props.host}
        setGroups={setPersistedGroups}
        onGroupCreated={setPersistedActiveGroupId}
        {...(props.onNavigateToSettings
          ? { onNavigateToSettings: props.onNavigateToSettings }
          : {})}
      />
    </main>
  )
}
