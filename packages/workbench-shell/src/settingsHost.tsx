import { createComponent, createEffect, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { X } from "lucide-solid"
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

  const activeSection = () => props.activeSectionId ?? "general"
  const activePanels = () => navigator().sections[activeSection()].panels
  const activeSectionTitle = () => {
    if (activeSection() === "plugins") return props.copy?.pluginsActiveTitle ?? "已安装插件"
    return (
      props.copy?.sectionTitle(activeSection()) ??
      SETTINGS_SECTIONS.find((section) => section.id === activeSection())?.title ??
      "设置"
    )
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

  return (
    <Show when={props.open}>
      <div
        class="settings-overlay settings-host"
        onClick={props.onClose}
        role="dialog"
        aria-modal="true"
        aria-label={props.copy?.sidebarTitle ?? "设置"}
      >
        <div class="settings-drawer" onClick={(e) => e.stopPropagation()}>
          <nav class="settings-sidebar">
            <div class="settings-sidebar-title">{props.copy?.sidebarTitle ?? "设置"}</div>
            <For each={workspaceSections()}>
              {(section) => (
                <button
                  class="settings-nav"
                  classList={{ active: section.id === activeSection() }}
                  onClick={() => props.onSectionChange(section.id)}
                >
                  {props.copy?.sectionTitle(section.id) ?? section.title}
                </button>
              )}
            </For>
            <Show when={pluginSection()}>
              {(section) => (
                <>
                  <div class="settings-sidebar-title settings-sidebar-group-title">
                    {props.copy?.pluginGroupTitle ?? "插件"}
                  </div>
                  <button
                    class="settings-nav"
                    classList={{ active: section().id === activeSection() }}
                    onClick={() => props.onSectionChange(section().id)}
                  >
                    {props.copy?.pluginInstalledNav ?? "已安装"}
                  </button>
                </>
              )}
            </Show>
            <div class="settings-sidebar-spacer" />
            <Show when={aboutSection()}>
              {(section) => (
                <button
                  class="settings-nav"
                  classList={{ active: section().id === activeSection() }}
                  onClick={() => props.onSectionChange(section().id)}
                >
                  {props.copy?.sectionTitle(section().id) ?? section().title}
                </button>
              )}
            </Show>
          </nav>
          <div class="settings-content">
            <div class="settings-tab-title">
              <span>{activeSectionTitle()}</span>
              <button
                class="settings-close-btn settings-close"
                onClick={props.onClose}
                aria-label={props.copy?.closeAriaLabel ?? "关闭设置"}
                ref={(element) => {
                  closeButtonRef = element
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div class="settings-tab-body">
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
                              {props.copy?.panelMissing(panel.id) ?? `设置面板不可用：${panel.id}`}
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
      </div>
    </Show>
  )
}
