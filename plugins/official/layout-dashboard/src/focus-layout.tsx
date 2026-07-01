import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { PluginInstance } from "@tabora/plugin-api"

import { HostActionIcon } from "./host-action-icon"
import { dateLabel, fallbackText, greeting } from "./i18n"
import { WorkbenchRail } from "./workbench-rail"
import type { LayoutViewPropsWithI18n } from "./types"

function widgetTitle(instance: PluginInstance) {
  const titles: Record<string, string> = {
    "quick-links": "快捷入口",
    todo: "待办",
    notes: "便签",
    weather: "天气",
  }
  return titles[instance.contributionId] ?? instance.contributionId
}

export function FocusLayout(props: LayoutViewPropsWithI18n<JSX.Element>) {
  const i18n = () => props.i18n
  const t = (key: string) => i18n()?.t(key) ?? fallbackText(key)
  const locale = () => i18n()?.locale() ?? "zh-CN"
  const [selectedHeroId, setSelectedHeroId] = createSignal<string | null>(null)
  const toolbarActions = () => props.host.getGlobalActions("toolbar")
  const commandAction = () => toolbarActions().find((action) => action.id === "command")
  const layoutSwitchAction = () => toolbarActions().find((action) => action.id === "layout-switch")
  const instances = () => props.regions["focus"]?.instances ?? []
  const heroInstance = createMemo(() => {
    const selected = selectedHeroId()
    return instances().find((instance) => instance.id === selected) ?? instances()[0] ?? null
  })
  const satelliteInstances = createMemo(() => {
    const hero = heroInstance()
    return instances().filter((instance) => instance.id !== hero?.id)
  })

  return (
    <main class="layout-focus" data-layout="focus">
      <WorkbenchRail host={props.host} />
      <section class="focus-shell">
        <div class="focus-content">
          <header class="focus-topbar">
            <div class="focus-greeting">
              <span>{greeting(t)}</span>
              <span class="focus-muted">· {dateLabel(locale())}</span>
            </div>
            <div class="focus-topbar-actions">
              <Show when={layoutSwitchAction()}>
                {(action) => (
                  <button
                    class="focus-icon-btn"
                    type="button"
                    aria-label={action().label}
                    title={action().label}
                    onClick={() => {
                      action().run()
                      props.host.showToast("已切换到 Dashboard 布局", { type: "success" })
                    }}
                  >
                    <HostActionIcon id={action().id} icon={action().icon} size={15} />
                  </button>
                )}
              </Show>
              <button
                class="focus-command"
                type="button"
                onClick={() => commandAction()?.run() ?? props.host.openCommandPalette()}
              >
                <span>{t("search.placeholder")}</span>
                <kbd>⌘K</kbd>
              </button>
            </div>
          </header>

          <section class="focus-hero" aria-label="专注卡片">
            <Show
              when={heroInstance()}
              fallback={
                <button
                  class="focus-empty"
                  type="button"
                  onClick={() => props.host.openAddWidget()}
                >
                  {t("focus.empty")}
                </button>
              }
            >
              {(instance) => (
                <div class="focus-hero-render">
                  {props.regions["focus"]!.renderInstance(instance())}
                </div>
              )}
            </Show>
          </section>

          <Show when={satelliteInstances().length > 0}>
            <section class="focus-satellites" aria-label="可切换卡片">
              <For each={satelliteInstances()}>
                {(instance) => (
                  <button
                    class="focus-satellite"
                    type="button"
                    onClick={() => setSelectedHeroId(instance.id)}
                  >
                    <span class="focus-satellite-title">{widgetTitle(instance)}</span>
                    <span class="focus-satellite-meta">{t("focus.switchHero")}</span>
                  </button>
                )}
              </For>
            </section>
          </Show>
        </div>
      </section>
    </main>
  )
}
