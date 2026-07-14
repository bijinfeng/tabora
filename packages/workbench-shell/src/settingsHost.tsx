import { createComponent, createEffect, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { Settings } from "lucide-solid"
import type { PluginManifest, SettingsPanelViewProps } from "@tabora/plugin-api"
import {
  createSettingsNavigator,
  normalizeSettingsPanelDescriptor,
  SETTINGS_SECTIONS,
  type SettingsPanelDescriptor as NavigatorSettingsPanelDescriptor,
  type SettingsSectionId,
} from "@tabora/orchestrator"
import { EmptyState, InlineError } from "@tabora/ui"
import { createPluginErrorFallback, PluginViewBoundary } from "./PluginViewBoundary"

type PluginLike = { manifest: Pick<PluginManifest, "id" | "contributes"> }

export type SettingsPanelDescriptor = NavigatorSettingsPanelDescriptor
export type { SettingsSectionId }
export { resolveInitialSettingsPanelId, resolveSettingsSectionId } from "@tabora/orchestrator"

export type SettingsHostProps = {
  open: boolean
  panels: SettingsPanelDescriptor[]
  activeSectionId: SettingsSectionId | null
  onSectionChange: (sectionId: SettingsSectionId) => void
  onClose: () => void
  getView: (viewId: string) => ((props: SettingsPanelViewProps) => JSX.Element) | undefined
  panelProps: (panel: SettingsPanelDescriptor) => SettingsPanelViewProps
  aboutContent?: JSX.Element
  copy?: SettingsHostCopy
}

export type SettingsHostCopy = {
  sidebarTitle: string
  pluginGroupTitle: string
  pluginInstalledNav: string
  pluginsActiveTitle: string
  closeAriaLabel: string
  aboutUnavailable: string
  emptySection: string
  panelMissing: (panelId: string) => string
  sectionTitle: (sectionId: SettingsSectionId) => string
  sectionDescription?: (sectionId: SettingsSectionId) => string
  sectionMeta?: (sectionId: SettingsSectionId) => string
}

export function collectSettingsPanels(plugins: PluginLike[]): SettingsPanelDescriptor[] {
  const panels: SettingsPanelDescriptor[] = []
  for (const plugin of plugins) {
    for (const panel of plugin.manifest.contributes.settingsPanels ?? []) {
      panels.push(normalizeSettingsPanelDescriptor({ ...panel, pluginId: plugin.manifest.id }))
    }
  }
  return panels.sort(
    (l, r) => (l.order ?? 10_000) - (r.order ?? 10_000) || l.title.localeCompare(r.title),
  )
}

export function resolveInitialSettingsSectionId(
  panels: SettingsPanelDescriptor[],
  requested?: string | null,
): SettingsSectionId {
  return createSettingsNavigator(panels).initialSectionId(requested)
}

export function SettingsHost(props: SettingsHostProps) {
  let closeButtonRef: HTMLButtonElement | undefined
  let previousFocusedElement: HTMLElement | null = null
  const navigator = () => createSettingsNavigator(props.panels)

  const [isEntering, setIsEntering] = createSignal(false)
  const [isClosing, setIsClosing] = createSignal(false)

  const handleClose = () => {
    if (isClosing()) return
    setIsClosing(true)
    setIsEntering(false)
    setTimeout(() => {
      setIsClosing(false)
      props.onClose()
    }, 250)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      handleClose()
    }
  }

  const activeSection = () => props.activeSectionId ?? "general"
  const activePanels = () => navigator().sections[activeSection()].panels
  const activePanelTitle = () => activeSectionTitle()
  const activeSectionTitle = () => {
    if (activeSection() === "plugins") return props.copy?.pluginsActiveTitle ?? "已安装插件"
    return (
      props.copy?.sectionTitle(activeSection()) ??
      SETTINGS_SECTIONS.find((section) => section.id === activeSection())?.title ??
      "设置"
    )
  }
  const activeSectionDescription = () => {
    const sectionId = activeSection()
    const description = props.copy?.sectionDescription?.(sectionId)
    if (description) return description
    if (sectionId === "general") return "工作区、布局和基础行为。所有设置只影响当前个人工作台。"
    if (sectionId === "appearance")
      return "主题、背景和界面语言。视觉配置通过插件贡献和 token 应用。"
    if (sectionId === "search") return "默认搜索源、启用状态和命令搜索行为。"
    if (sectionId === "plugins") return "查看插件贡献能力、权限摘要和当前启用状态。"
    return "Tabora 版本、协议和本地运行信息。"
  }
  const activeSectionMeta = () => {
    const sectionId = activeSection()
    const meta = props.copy?.sectionMeta?.(sectionId)
    if (meta) return meta
    if (sectionId === "general") return "本地保存"
    if (sectionId === "appearance") return "即时生效"
    if (sectionId === "search") return "快捷入口"
    if (sectionId === "plugins") return `${activePanels().length} 项`
    return "V2"
  }
  const workspaceSections = () =>
    SETTINGS_SECTIONS.filter((section) => ["general", "appearance", "search"].includes(section.id))
  const pluginSection = () => SETTINGS_SECTIONS.find((section) => section.id === "plugins")
  const aboutSection = () => SETTINGS_SECTIONS.find((section) => section.id === "about")

  createEffect(() => {
    if (props.open) {
      previousFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      closeButtonRef?.focus()
      return
    }

    if (previousFocusedElement && document.contains(previousFocusedElement)) {
      previousFocusedElement.focus()
    }
    previousFocusedElement = null
  })

  createEffect(() => {
    if (props.open && !isClosing()) {
      setTimeout(() => setIsEntering(true), 10)
    } else {
      setIsEntering(false)
    }
  })

  return (
    <Show when={props.open}>
      <div
        class="settings-overlay settings-host"
        classList={{ "is-entering": isEntering() }}
        onClick={handleClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={props.copy?.sidebarTitle ?? "设置"}
      >
        <div
          class="settings-window"
          classList={{ "is-entering": isEntering() }}
          onClick={(e) => e.stopPropagation()}
        >
          <header class="window-head">
            <div class="window-title">
              <div class="window-title-icon">
                <Settings size={14} />
              </div>
              <div class="window-title-main">
                <strong>设置</strong>
                <span>{activePanelTitle()}</span>
              </div>
            </div>
            <button
              class="icon-close"
              onClick={handleClose}
              ref={(el) => (closeButtonRef = el)}
              aria-label={props.copy?.closeAriaLabel ?? "关闭设置"}
            />
          </header>
          <div class="settings-body">
            <nav class="settings-nav">
              <div class="nav-kicker">工作区</div>
              <For each={workspaceSections()}>
                {(section) => (
                  <button
                    class="nav-button"
                    classList={{ "is-active": section.id === activeSection() }}
                    onClick={() => props.onSectionChange(section.id)}
                  >
                    {props.copy?.sectionTitle(section.id) ?? section.title}
                  </button>
                )}
              </For>
              <Show when={pluginSection()}>
                {(section) => (
                  <>
                    <div class="nav-kicker">{props.copy?.pluginGroupTitle ?? "插件"}</div>
                    <button
                      class="nav-button"
                      classList={{ "is-active": section().id === activeSection() }}
                      onClick={() => props.onSectionChange(section().id)}
                    >
                      {props.copy?.pluginInstalledNav ?? "已安装"}
                    </button>
                  </>
                )}
              </Show>
              <div class="nav-spacer" />
              <Show when={aboutSection()}>
                {(section) => (
                  <button
                    class="nav-button"
                    classList={{ "is-active": section().id === activeSection() }}
                    onClick={() => props.onSectionChange(section().id)}
                  >
                    {props.copy?.sectionTitle(section().id) ?? section().title}
                  </button>
                )}
              </Show>
            </nav>
            <div class="settings-main" data-active-view={activeSection()}>
              <div class="panel-head">
                <div>
                  <strong>{activeSectionTitle()}</strong>
                  <span>{activeSectionDescription()}</span>
                </div>
                <span class="panel-meta">{activeSectionMeta()}</span>
              </div>
              <div class="panel-view" classList={{ "is-active": true }} data-view={activeSection()}>
                <Show
                  when={activeSection() !== "about"}
                  fallback={
                    props.aboutContent ?? (
                      <EmptyState
                        class="settings-empty"
                        compact
                        title={props.copy?.aboutUnavailable ?? "关于信息暂不可用"}
                      />
                    )
                  }
                >
                  <Show
                    when={activePanels().length > 0}
                    fallback={
                      <EmptyState
                        class="settings-empty"
                        compact
                        title={props.copy?.emptySection ?? "该分类下暂无设置内容"}
                      />
                    }
                  >
                    <div class="settings-panel-stack-host">
                      <For each={activePanels()}>
                        {(panel) => {
                          const View = props.getView(panel.view)
                          if (!View)
                            return (
                              <InlineError class="settings-panel-missing">
                                {props.copy?.panelMissing(panel.id) ??
                                  `设置面板不可用：${panel.id}`}
                              </InlineError>
                            )
                          let content: JSX.Element
                          try {
                            content = createComponent(View, props.panelProps(panel))
                          } catch (error) {
                            return createPluginErrorFallback(error, panel.id, panel.title)
                          }
                          return (
                            <PluginViewBoundary instanceId={panel.id} title={panel.title}>
                              <div data-tabora-plugin-id={panel.pluginId}>{content}</div>
                            </PluginViewBoundary>
                          )
                        }}
                      </For>
                    </div>
                  </Show>
                </Show>
              </div>
            </div>
          </div>
          <footer class="window-foot">
            <span>Esc 关闭</span>
            <div class="footer-actions" />
          </footer>
        </div>
      </div>
    </Show>
  )
}
