import { createComponent, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { X } from "lucide-solid"
import type {
  PluginManifest,
  SettingsPanelContribution,
  SettingsPanelViewProps,
} from "@tabora/plugin-api"
import { createPluginErrorFallback, PluginViewBoundary } from "./PluginViewBoundary"

type PluginLike = { manifest: Pick<PluginManifest, "id" | "contributes"> }

export type SettingsPanelDescriptor = SettingsPanelContribution & { pluginId: string }

export type SettingsHostProps = {
  open: boolean
  panels: SettingsPanelDescriptor[]
  activePanelId: string | null
  onPanelChange: (panelId: string) => void
  onClose: () => void
  getView: (viewId: string) => ((props: SettingsPanelViewProps) => JSX.Element) | undefined
  panelProps: (panel: SettingsPanelDescriptor) => SettingsPanelViewProps
}

export function collectSettingsPanels(plugins: PluginLike[]): SettingsPanelDescriptor[] {
  const panels: SettingsPanelDescriptor[] = []
  for (const plugin of plugins) {
    for (const panel of plugin.manifest.contributes.settingsPanels ?? []) {
      panels.push({ ...panel, pluginId: plugin.manifest.id })
    }
  }
  return panels.sort(
    (l, r) => (l.order ?? 10_000) - (r.order ?? 10_000) || l.title.localeCompare(r.title),
  )
}

export function resolveInitialSettingsPanelId(
  panels: SettingsPanelDescriptor[],
  requested?: string | null,
): string | null {
  if (requested && panels.some((p) => p.id === requested)) return requested
  return panels[0]?.id ?? null
}

export function SettingsHost(props: SettingsHostProps) {
  const activePanel = () => props.panels.find((p) => p.id === props.activePanelId)

  return (
    <Show when={props.open}>
      <div class="settings-overlay" onClick={props.onClose}>
        <div class="settings-drawer" onClick={(e) => e.stopPropagation()}>
          <nav class="settings-sidebar">
            <div class="settings-sidebar-title">设置</div>
            <For each={props.panels}>
              {(panel) => (
                <button
                  class="settings-nav"
                  classList={{ active: panel.id === props.activePanelId }}
                  onClick={() => props.onPanelChange(panel.id)}
                >
                  {panel.title}
                </button>
              )}
            </For>
          </nav>
          <div class="settings-content">
            <div class="settings-tab-title">
              <span>{activePanel()?.title ?? "设置"}</span>
              <button class="settings-close-btn" onClick={props.onClose} aria-label="关闭设置">
                <X size={16} />
              </button>
            </div>
            <div class="settings-tab-body">
              <Show
                when={activePanel()}
                fallback={<div class="settings-empty">选择一个设置面板</div>}
              >
                {(panel) => {
                  const View = props.getView(panel().view)
                  if (!View)
                    return (
                      <div class="settings-panel-missing" role="alert">
                        设置面板不可用：{panel().id}
                      </div>
                    )
                  let content: JSX.Element
                  try {
                    content = createComponent(View, props.panelProps(panel()))
                  } catch (error) {
                    return createPluginErrorFallback(error, panel().id, panel().title)
                  }
                  return (
                    <PluginViewBoundary instanceId={panel().id} title={panel().title}>
                      {content}
                    </PluginViewBoundary>
                  )
                }}
              </Show>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}
