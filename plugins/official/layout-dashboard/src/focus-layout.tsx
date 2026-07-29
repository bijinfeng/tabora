import * as stylex from "@stylexjs/stylex"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { PluginInstance } from "@tabora/plugin-api"
import { Button, IconButton } from "@tabora/ui"
import { ChevronLeft, ChevronRight } from "lucide-solid"

import { dateLabel, fallbackText, greeting } from "./i18n"
import { styles } from "./styles"
import { WorkbenchRail } from "./workbench-rail"
import type { LayoutViewPropsWithI18n } from "./types"

const satellitePageSize = 4

function widgetTitle(instance: PluginInstance) {
  const titles: Record<string, string> = {
    "quick-links": "快捷入口",
    todo: "待办",
    notes: "便签",
    weather: "天气",
  }
  return titles[instance.contributionId] ?? instance.contributionId
}

function isKeyboardActivation(event: KeyboardEvent) {
  return event.key === "Enter" || event.key === " "
}

function previewInstance(instance: PluginInstance, size: "M" | "XL"): PluginInstance {
  return { ...instance, size }
}

function applyInlineStyles(
  element: HTMLElement | null | undefined,
  styles: Record<string, string>,
) {
  if (!element) return
  for (const [name, value] of Object.entries(styles)) {
    element.style.setProperty(name, value)
  }
}

function flattenEmbeddedWidgetFrame(root: HTMLElement) {
  applyInlineStyles(root.querySelector<HTMLElement>("[data-workbench-grid-item]"), {
    "aspect-ratio": "auto",
    display: "block",
    "grid-column": "auto",
    "grid-row": "auto",
    height: "100%",
    "min-height": "0",
    "min-width": "0",
    outline: "none",
    width: "100%",
  })
  applyInlineStyles(root.querySelector<HTMLElement>("[data-widget-card]"), {
    border: "0",
    "border-radius": "0",
    "box-shadow": "none",
    cursor: "default",
    height: "100%",
    "min-height": "0",
    overflow: "hidden",
    "touch-action": "auto",
    width: "100%",
  })
  applyInlineStyles(root.querySelector<HTMLElement>("[data-widget-card-body]"), {
    "border-radius": "0",
    height: "100%",
    "min-height": "0",
    width: "100%",
  })
  applyInlineStyles(root.querySelector<HTMLElement>("[data-widget-card-actions]"), {
    display: "none",
  })
}

export function FocusLayout(props: LayoutViewPropsWithI18n<JSX.Element>) {
  let focusRoot: HTMLElement | undefined
  const i18n = () => props.i18n
  const t = (key: string) => i18n()?.t(key) ?? fallbackText(key)
  const locale = () => i18n()?.locale() ?? "zh-CN"
  const [selectedHeroId, setSelectedHeroId] = createSignal<string | null>(null)
  const [satellitePage, setSatellitePage] = createSignal(0)
  const toolbarActions = () => props.host.getGlobalActions("toolbar")
  const commandAction = () => toolbarActions().find((action) => action.id === "command")
  const instances = () => props.regions["focus"]?.instances ?? []
  const heroInstance = createMemo(() => {
    const selected = selectedHeroId()
    return instances().find((instance) => instance.id === selected) ?? instances()[0] ?? null
  })
  const satelliteInstances = createMemo(() => {
    const hero = heroInstance()
    return instances().filter((instance) => instance.id !== hero?.id)
  })
  const satellitePageCount = createMemo(() =>
    Math.max(1, Math.ceil(satelliteInstances().length / satellitePageSize)),
  )
  const currentSatellitePage = createMemo(() => Math.min(satellitePage(), satellitePageCount() - 1))
  const visibleSatelliteInstances = createMemo(() => {
    const start = currentSatellitePage() * satellitePageSize
    return satelliteInstances().slice(start, start + satellitePageSize)
  })

  const selectHero = (instance: PluginInstance) => {
    setSelectedHeroId(instance.id)
    props.host.showToast(`已切换 Hero → ${widgetTitle(instance)}`, { type: "success" })
  }

  const changeSatellitePage = (delta: number) => {
    setSatellitePage((page) => Math.max(0, Math.min(page + delta, satellitePageCount() - 1)))
  }

  createEffect(() => {
    const heroId = heroInstance()?.id ?? ""
    const visibleIds = visibleSatelliteInstances()
      .map((instance) => instance.id)
      .join("|")
    void heroId
    void visibleIds
    queueMicrotask(() => {
      focusRoot
        ?.querySelectorAll<HTMLElement>("[data-focus-plugin]")
        .forEach(flattenEmbeddedWidgetFrame)
    })
  })

  return (
    <main
      {...stylex.attrs(styles.layout)}
      data-layout="focus"
      ref={(element) => {
        focusRoot = element
      }}
    >
      <WorkbenchRail host={props.host} />
      <section {...stylex.attrs(styles.focusShell)}>
        <div {...stylex.attrs(styles.focusContent)}>
          <header {...stylex.attrs(styles.focusTopbar)}>
            <div {...stylex.attrs(styles.focusGreeting)}>
              <span>{greeting(t)}</span>
              <span {...stylex.attrs(styles.focusMuted)}>· {dateLabel(locale())}</span>
            </div>
            <div {...stylex.attrs(styles.focusActions)}>
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
              <section {...stylex.attrs(styles.hero)} data-focus-hero aria-label="专注主卡片">
                <div {...stylex.attrs(styles.focusCardHead)} data-focus-card-head>
                  <span {...stylex.attrs(styles.focusCardTitle)}>{widgetTitle(instance())}</span>
                  <span {...stylex.attrs(styles.focusCardSize)}>Hero</span>
                </div>
                <div
                  {...stylex.attrs(styles.focusPlugin, styles.focusPluginHero)}
                  data-focus-plugin
                  ref={flattenEmbeddedWidgetFrame}
                >
                  {props.regions["focus"]!.renderInstance(previewInstance(instance(), "XL"))}
                </div>
              </section>
            )}
          </Show>

          <Show when={satelliteInstances().length > 0}>
            <Show when={satelliteInstances().length > satellitePageSize}>
              <nav {...stylex.attrs(styles.focusPager)} aria-label="卫星卡片分页">
                <IconButton
                  size="sm"
                  variant="secondary"
                  xstyle={styles.focusPageButton}
                  aria-label="上一组卫星卡片"
                  disabled={currentSatellitePage() === 0}
                  onClick={() => changeSatellitePage(-1)}
                >
                  <ChevronLeft size={14} />
                </IconButton>
                <span {...stylex.attrs(styles.focusPageLabel)} data-focus-page-label>
                  {currentSatellitePage() + 1} / {satellitePageCount()}
                </span>
                <IconButton
                  size="sm"
                  variant="secondary"
                  xstyle={styles.focusPageButton}
                  aria-label="下一组卫星卡片"
                  disabled={currentSatellitePage() === satellitePageCount() - 1}
                  onClick={() => changeSatellitePage(1)}
                >
                  <ChevronRight size={14} />
                </IconButton>
              </nav>
            </Show>
            <section {...stylex.attrs(styles.satellites)} aria-label="可切换卡片">
              <For each={visibleSatelliteInstances()}>
                {(instance) => (
                  <section
                    {...stylex.attrs(styles.satellite)}
                    data-focus-satellite
                    role="button"
                    tabIndex={0}
                    aria-label={`切换到 ${widgetTitle(instance)}`}
                    onClick={() => selectHero(instance)}
                    onKeyDown={(event) => {
                      if (!isKeyboardActivation(event)) return
                      event.preventDefault()
                      selectHero(instance)
                    }}
                  >
                    <div {...stylex.attrs(styles.focusCardHead, styles.satelliteHead)}>
                      <span {...stylex.attrs(styles.focusCardTitle)}>{widgetTitle(instance)}</span>
                      <span {...stylex.attrs(styles.satelliteMeta)}>{t("focus.switchHero")}</span>
                    </div>
                    <div
                      {...stylex.attrs(styles.focusPlugin, styles.focusPluginSatellite)}
                      data-focus-plugin
                      data-focus-preview
                      aria-hidden="true"
                      ref={(element) => {
                        if (element) element.inert = true
                        flattenEmbeddedWidgetFrame(element)
                      }}
                    >
                      {props.regions["focus"]!.renderInstance(previewInstance(instance, "M"))}
                    </div>
                  </section>
                )}
              </For>
            </section>
          </Show>
        </div>
      </section>
    </main>
  )
}
