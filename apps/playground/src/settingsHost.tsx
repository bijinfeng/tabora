import { createComponent, createMemo, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { X } from "lucide-solid"
import type {
  PluginManifest,
  SettingsPanelContribution,
  SettingsPanelViewProps,
} from "@tabora/plugin-api"
import { createPluginErrorFallback, PluginViewBoundary } from "./PluginViewBoundary"

type PluginLike = {
  manifest: Pick<PluginManifest, "id" | "contributes">
}

export type SettingsPanelDescriptor = SettingsPanelContribution & {
  pluginId: string
}

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
    (left, right) =>
      (left.order ?? 10_000) - (right.order ?? 10_000) || left.title.localeCompare(right.title),
  )
}

export function resolveInitialSettingsPanelId(
  panels: SettingsPanelDescriptor[],
  requestedPanelId?: string | null,
): string | null {
  if (requestedPanelId && panels.some((panel) => panel.id === requestedPanelId)) {
    return requestedPanelId
  }
  return panels[0]?.id ?? null
}

function renderPanel(
  panel: SettingsPanelDescriptor,
  getView: SettingsHostProps["getView"],
  panelProps: SettingsHostProps["panelProps"],
): JSX.Element {
  const View = getView(panel.view)
  if (!View) {
    return (
      <div class="settings-panel-missing" role="alert">
        设置面板不可用：{panel.id}
      </div>
    )
  }

  let viewResult: JSX.Element
  try {
    viewResult = createComponent(View, panelProps(panel))
  } catch (error) {
    return createPluginErrorFallback(error, panel.id, panel.title)
  }

  return (
    <PluginViewBoundary instanceId={panel.id} title={panel.title}>
      {viewResult}
    </PluginViewBoundary>
  )
}

export function SettingsHost(props: SettingsHostProps) {
  const activePanel = createMemo(() => {
    const requested = props.activePanelId
    return props.panels.find((panel) => panel.id === requested) ?? props.panels[0] ?? null
  })

  const panelContent = createMemo(() => {
    const panel = activePanel()
    if (!panel) {
      return <div class="settings-panel-missing">暂无设置面板</div>
    }
    return renderPanel(panel, props.getView, props.panelProps)
  })

  return (
    <Show when={props.open}>
      <div class="settings-overlay" onClick={props.onClose}>
        <section
          class="settings-host"
          role="dialog"
          aria-modal="true"
          aria-label="设置"
          onClick={(event) => event.stopPropagation()}
        >
          <header class="settings-host-header">
            <div>
              <h2>设置</h2>
              <p>管理工作台、插件和搜索偏好</p>
            </div>
            <button
              class="settings-close"
              type="button"
              aria-label="关闭设置"
              onClick={props.onClose}
            >
              <X />
            </button>
          </header>
          <div class="settings-host-body">
            <nav class="settings-nav" aria-label="设置面板">
              <For each={props.panels}>
                {(panel) => (
                  <button
                    class="settings-nav-item"
                    classList={{ active: activePanel()?.id === panel.id }}
                    type="button"
                    aria-current={activePanel()?.id === panel.id ? "page" : undefined}
                    onClick={() => props.onPanelChange(panel.id)}
                  >
                    {panel.title}
                  </button>
                )}
              </For>
            </nav>
            <main class="settings-panel-region">{panelContent()}</main>
          </div>
        </section>
      </div>
    </Show>
  )
}
