import { TaboraMark } from "@tabora/brand"
import type { PluginInstance, WidgetViewProps, WidgetSize } from "@tabora/plugin-api"
import { PluginViewBoundary, WidgetCardShell } from "@tabora/workbench-shell"
import { Moon, Sun, X } from "lucide-solid"
import { For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type {
  ShellTranslation,
  WorkbenchShellPluginViewBoundaryCopy,
  WorkbenchShellWidgetCopy,
} from "../i18n"

type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

type AvailableWidget = {
  pluginId: string
  id: string
  icon?: string
  title: string
  description?: string
}

type WidgetContextSection = {
  items: Array<{
    label: string
    danger?: boolean
    isCurrent?: boolean
    run: () => void
  }>
}

type ExpandState = {
  instanceId: string
  title: string
  viewId: string
  mode: "expand" | "settings"
  props: WidgetViewProps
}

type SafeLayoutModel = {
  title: string
  icon?: string
  currentSize: WidgetSize
  supportedSizes: WidgetSize[]
}

export function WorkbenchAddWidgetModal(props: {
  open: boolean
  availableWidgets: AvailableWidget[]
  widgetIconLabel: (icon?: string) => string
  tShell?: ShellTranslation
  onAdd: (pluginId: string, widgetId: string) => void
  onClose: () => void
}) {
  return (
    <Show when={props.open}>
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal-container" onClick={(event) => event.stopPropagation()}>
          <div class="modal-title">{props.tShell?.("chrome.addWidget.title") ?? "添加卡片"}</div>
          <div class="modal-body">
            <For each={props.availableWidgets}>
              {(widget) => (
                <button
                  class="add-widget-modal-item"
                  onClick={() => props.onAdd(widget.pluginId, widget.id)}
                >
                  <span class="add-widget-modal-icon">{props.widgetIconLabel(widget.icon)}</span>
                  <span class="add-widget-modal-info">
                    <div class="add-widget-modal-name">{widget.title}</div>
                    <div class="add-widget-modal-desc">{widget.description}</div>
                  </span>
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  )
}

export function WorkbenchSettingsAboutContent(props: {
  workspaceName: string
  enabledPluginCount: number
}) {
  return (
    <div class="settings-panel-stack-host">
      <section class="widget-card">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-text">关于 Tabora</span>
          </div>
        </div>
        <div class="card-body">
          <p>当前实现已切换到双布局工作台骨架，设置中心按固定分类组织插件设置内容。</p>
          <p>当前工作区：{props.workspaceName}。</p>
          <p>已启用官方插件：{props.enabledPluginCount}。</p>
        </div>
      </section>
    </div>
  )
}

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

export function WorkbenchExpandOverlay(props: {
  expandState: ExpandState | null
  getView: (viewId: string) => SolidView<WidgetViewProps> | undefined
  widgetIconForProps: (props: WidgetViewProps) => JSX.Element
  onClose: () => void
  tShell?: ShellTranslation
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  return (
    <Show when={props.expandState}>
      {(expand) => (
        <div class="expand-overlay" onClick={props.onClose}>
          <div class="expand-shell" onClick={(event) => event.stopPropagation()}>
            <div class="expand-header">
              <div class="expand-title">
                <span class="expand-title-icon">{props.widgetIconForProps(expand().props)}</span>
                <div class="expand-title-texts">
                  <span class="expand-title-text">{expand().title}</span>
                  <span class="expand-title-meta">
                    {expand().mode === "settings"
                      ? (props.tShell?.("chrome.expand.meta.settings") ?? "实例设置")
                      : (props.tShell?.("chrome.expand.meta.expand") ?? "插件展开视图")}
                  </span>
                </div>
              </div>
              <button
                class="expand-close-btn"
                onClick={props.onClose}
                aria-label={
                  expand().mode === "settings"
                    ? (props.tShell?.("chrome.expand.close.settings") ?? "关闭实例设置")
                    : (props.tShell?.("chrome.expand.close.expand") ?? "关闭展开视图")
                }
              >
                <X size={18} />
              </button>
            </div>
            <div class="expand-body">
              {(() => {
                const View = props.getView(expand().viewId)
                if (!View) {
                  return (
                    <div class="settings-panel-missing" role="alert">
                      {props.tShell
                        ? props.tShell("chrome.expand.viewMissing", { viewId: expand().viewId })
                        : `展开视图不可用：${expand().viewId}`}
                    </div>
                  )
                }

                return (
                  <PluginViewBoundary
                    instanceId={expand().instanceId}
                    title={expand().title}
                    {...(props.pluginViewBoundaryCopy
                      ? { copy: props.pluginViewBoundaryCopy }
                      : {})}
                  >
                    <div data-tabora-plugin-id={expand().props.pluginId}>
                      {View(expand().props)}
                    </div>
                  </PluginViewBoundary>
                )
              })()}
            </div>
            <div class="expand-footer">
              <span class="expand-footer-meta">{expand().instanceId}</span>
              <span class="expand-close-hint">
                {props.tShell?.("chrome.expand.footerHint") ?? "Esc 关闭 · 双击打开 · 右键菜单"}
              </span>
            </div>
          </div>
        </div>
      )}
    </Show>
  )
}

export function WorkbenchPluginModal(props: {
  viewId: string | null
  modalProps: Record<string, unknown>
  getView: (viewId: string) => SolidView | undefined
  onClose: () => void
  tShell?: ShellTranslation
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  return (
    <Show when={props.viewId}>
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal-container" onClick={(event) => event.stopPropagation()}>
          <button
            class="modal-close"
            aria-label={props.tShell?.("chrome.modal.close") ?? "关闭"}
            onClick={props.onClose}
          >
            <X size={16} />
          </button>
          <div class="modal-body">
            {(() => {
              const viewId = props.viewId
              if (!viewId) return null
              const View = props.getView(viewId)
              if (!View) return null

              return (
                <PluginViewBoundary
                  instanceId={resolvePluginBoundaryId(props.modalProps, viewId)}
                  title={viewId}
                  {...(props.pluginViewBoundaryCopy ? { copy: props.pluginViewBoundaryCopy } : {})}
                >
                  <div data-tabora-plugin-id={resolvePluginScopeId(props.modalProps)}>
                    {View(props.modalProps)}
                  </div>
                </PluginViewBoundary>
              )
            })()}
          </div>
        </div>
      </div>
    </Show>
  )
}

export function WorkbenchFullscreenOverlay(props: {
  viewId: string | null
  fullscreenProps: Record<string, unknown>
  getView: (viewId: string) => SolidView | undefined
  onClose: () => void
  tShell?: ShellTranslation
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  return (
    <Show when={props.viewId}>
      <div class="fullscreen-overlay">
        <button
          class="fullscreen-close"
          aria-label={props.tShell?.("chrome.fullscreen.close") ?? "关闭全屏视图"}
          onClick={props.onClose}
        >
          <X size={18} />
        </button>
        <div class="fullscreen-body">
          {(() => {
            const viewId = props.viewId
            if (!viewId) return null
            const View = props.getView(viewId)
            if (!View) return null

            return (
              <PluginViewBoundary
                instanceId={resolvePluginBoundaryId(props.fullscreenProps, viewId)}
                title={viewId}
                {...(props.pluginViewBoundaryCopy ? { copy: props.pluginViewBoundaryCopy } : {})}
              >
                <div data-tabora-plugin-id={resolvePluginScopeId(props.fullscreenProps)}>
                  {View(props.fullscreenProps)}
                </div>
              </PluginViewBoundary>
            )
          })()}
        </div>
      </div>
    </Show>
  )
}

function resolvePluginBoundaryId(props: Record<string, unknown>, fallback: string): string {
  return typeof props.instanceId === "string" ? props.instanceId : fallback
}

function resolvePluginScopeId(props: Record<string, unknown>): string | undefined {
  return typeof props.pluginId === "string" ? props.pluginId : undefined
}

export function WorkbenchContextMenuOverlay(props: {
  menu: { x: number; y: number; instanceId: string } | null
  sections: WidgetContextSection[]
  tShell?: ShellTranslation
  onClose: () => void
}) {
  return (
    <Show when={props.menu}>
      {(menu) => (
        <div class="ctx-menu-overlay" onClick={props.onClose}>
          <div class="ctx-menu-panel" style={{ left: `${menu().x}px`, top: `${menu().y}px` }}>
            <For each={props.sections}>
              {(section, sectionIndex) => (
                <>
                  <Show when={sectionIndex() > 0}>
                    <hr class="ctx-menu-sep" />
                  </Show>
                  <For each={section.items}>
                    {(item) => (
                      <button
                        class="ctx-menu-item"
                        classList={{ "ctx-menu-danger": item.danger }}
                        onClick={() => {
                          item.run()
                          props.onClose()
                        }}
                      >
                        {item.label}
                        <Show when={item.isCurrent}>
                          <span class="ctx-menu-check">
                            {props.tShell?.("chrome.contextMenu.current") ?? "当前"}
                          </span>
                        </Show>
                      </button>
                    )}
                  </For>
                </>
              )}
            </For>
          </div>
        </div>
      )}
    </Show>
  )
}
