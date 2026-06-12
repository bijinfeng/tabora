import { TaboraMark } from "@tabora/brand"
import type { PluginInstance, WidgetViewProps, WidgetSize } from "@tabora/plugin-api"
import { PluginViewBoundary, WidgetCardShell } from "@tabora/workbench-shell"
import { Moon, Sun } from "lucide-solid"
import { For } from "solid-js"
import type { JSX } from "solid-js"

import type {
  ShellTranslation,
  WorkbenchShellPluginViewBoundaryCopy,
  WorkbenchShellWidgetCopy,
} from "../i18n"
import type { SafeLayoutModel, SolidView } from "./WorkbenchShellChrome.types"

export function SafeWorkbenchLayout(props: {
  isDark: boolean
  instances: PluginInstance[]
  tShell?: ShellTranslation
  widgetContribution: (
    instance: Pick<PluginInstance, "pluginId" | "contributionId">,
  ) => { icon?: string; views: { card: string } } | null | undefined
  resolveWidgetModel: (instance: PluginInstance) => SafeLayoutModel | null
  getView: (viewId: string) => SolidView<WidgetViewProps> | undefined
  renderWidgetIcon: (icon?: string) => JSX.Element
  buildWidgetViewProps: (instance: PluginInstance, model: SafeLayoutModel) => WidgetViewProps
  onOpenCommandPalette: () => void
  onToggleTheme: () => void
  onOpenSettings: () => void
  onOpenExpand: (instance: PluginInstance) => void
  onOpenContextMenu: (event: MouseEvent, instanceId: string) => void
  onResize: (instanceId: string, size: WidgetSize) => void
  onRemove: (instanceId: string) => void
  isDragging: (instanceId: string) => boolean
  widgetShellCopy?: WorkbenchShellWidgetCopy
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  return (
    <div class="safe-layout">
      <div class="safe-layout-toolbar">
        <span class="toolbar-logo">
          <TaboraMark class="toolbar-logo-mark" />
          <span>Tabora</span>
        </span>
        <div style={{ flex: 1 }} />
        <button class="toolbar-btn" onClick={props.onOpenCommandPalette}>
          {props.tShell?.("chrome.toolbar.search") ?? "搜索"}
        </button>
        <button
          class="toolbar-btn"
          aria-label={
            props.isDark
              ? (props.tShell?.("chrome.toolbar.toggleThemeToLight") ?? "切换到明亮主题")
              : (props.tShell?.("chrome.toolbar.toggleThemeToDark") ?? "切换到暗色主题")
          }
          onClick={props.onToggleTheme}
        >
          {props.isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button class="toolbar-btn" onClick={props.onOpenSettings}>
          {props.tShell?.("chrome.toolbar.settings") ?? "设置"}
        </button>
      </div>
      <div class="safe-layout-list">
        <For each={props.instances}>
          {(instance) => {
            const widget = props.widgetContribution(instance)
            const model = props.resolveWidgetModel(instance)
            if (!model) {
              return (
                <div class="settings-empty">
                  {props.tShell
                    ? props.tShell("placeholders.widgetInstanceInvalid", {
                        instanceId: instance.id,
                      })
                    : `卡片实例无效：${instance.id}`}
                </div>
              )
            }
            const viewId = widget?.views.card
            const View = viewId ? props.getView(viewId) : undefined
            if (!View) return null

            return (
              <WidgetCardShell
                instance={instance}
                title={model.title}
                icon={props.renderWidgetIcon(model.icon)}
                supportedSizes={model.supportedSizes}
                currentSize={model.currentSize}
                {...(props.widgetShellCopy ? { copy: props.widgetShellCopy } : {})}
                callbacks={{
                  onDblClick: () => props.onOpenExpand(instance),
                  onContextMenu: (event: MouseEvent) => props.onOpenContextMenu(event, instance.id),
                  onResize: (size: WidgetSize) => props.onResize(instance.id, size),
                  onRemove: () => props.onRemove(instance.id),
                  onExpand: () => props.onOpenExpand(instance),
                  isDragging: props.isDragging(instance.id),
                }}
              >
                <PluginViewBoundary
                  instanceId={instance.id}
                  title={model.title}
                  {...(props.pluginViewBoundaryCopy ? { copy: props.pluginViewBoundaryCopy } : {})}
                >
                  <div data-tabora-plugin-id={instance.pluginId}>
                    {View(props.buildWidgetViewProps(instance, model))}
                  </div>
                </PluginViewBoundary>
              </WidgetCardShell>
            )
          }}
        </For>
      </div>
    </div>
  )
}
