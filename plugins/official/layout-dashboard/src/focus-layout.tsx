import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { PluginInstance } from "@tabora/plugin-api"
import { Button, IconButton } from "@tabora/ui"

import { HostActionIcon } from "./host-action-icon"
import { dateLabel, fallbackText, greeting } from "./i18n"
import { styles } from "./styles"
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
    <main {...stylex.attrs(styles.layout)} data-layout="focus">
      <WorkbenchRail host={props.host} />
      <section {...stylex.attrs(styles.focusShell)}>
        <div {...stylex.attrs(styles.focusContent)}>
          <header {...stylex.attrs(styles.focusTopbar)}>
            <div {...stylex.attrs(styles.focusGreeting)}>
              <span>{greeting(t)}</span>
              <span {...stylex.attrs(styles.focusMuted)}>· {dateLabel(locale())}</span>
            </div>
            <div {...stylex.attrs(styles.focusActions)}>
              <Show when={layoutSwitchAction()}>
                {(action) => (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    xstyle={[styles.focusControl, styles.focusIconButton]}
                    aria-label={action().label}
                    title={action().label}
                    onClick={() => {
                      action().run()
                      props.host.showToast("已切换到 Dashboard 布局", { type: "success" })
                    }}
                  >
                    <HostActionIcon id={action().id} icon={action().icon} size={15} />
                  </IconButton>
                )}
              </Show>
              <Button
                size="sm"
                variant="ghost"
                xstyle={[styles.focusControl, styles.focusCommand]}
                onClick={() => commandAction()?.run() ?? props.host.openCommandPalette()}
              >
                <span>{t("search.placeholder")}</span>
                <kbd {...stylex.attrs(styles.focusKbd)}>⌘K</kbd>
              </Button>
            </div>
          </header>

          <section {...stylex.attrs(styles.hero)} aria-label="专注卡片">
            <Show
              when={heroInstance()}
              fallback={
                <Button
                  size="md"
                  variant="ghost"
                  xstyle={styles.focusEmpty}
                  onClick={() => props.host.openAddWidget()}
                >
                  {t("focus.empty")}
                </Button>
              }
            >
              {(instance) => (
                <div {...stylex.attrs(styles.heroRender)}>
                  {props.regions["focus"]!.renderInstance(instance())}
                </div>
              )}
            </Show>
          </section>

          <Show when={satelliteInstances().length > 0}>
            <section {...stylex.attrs(styles.satellites)} aria-label="可切换卡片">
              <For each={satelliteInstances()}>
                {(instance) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    xstyle={styles.satellite}
                    data-focus-satellite
                    onClick={() => setSelectedHeroId(instance.id)}
                  >
                    <span {...stylex.attrs(styles.satelliteTitle)}>{widgetTitle(instance)}</span>
                    <span {...stylex.attrs(styles.satelliteMeta)}>{t("focus.switchHero")}</span>
                  </Button>
                )}
              </For>
            </section>
          </Show>
        </div>
      </section>
    </main>
  )
}
