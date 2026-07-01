import type { WidgetViewProps } from "@tabora/plugin-api"
import { PluginViewBoundary } from "@tabora/workbench-shell"
import { X } from "lucide-solid"
import { Show } from "solid-js"
import type { JSX } from "solid-js"

import type { ShellTranslation, WorkbenchShellPluginViewBoundaryCopy } from "../i18n"
import type { SolidView } from "./WorkbenchShellChrome.types"
import type { WorkbenchExpandState } from "./WorkbenchShellInteractions"

export function WorkbenchExpandOverlay(props: {
  expandState: WorkbenchExpandState | null
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
              {(() => {
                const footerViewId = expand().footerViewId
                const FooterView = footerViewId ? props.getView(footerViewId) : undefined
                if (!FooterView) {
                  return (
                    <>
                      <span class="expand-footer-meta">{expand().instanceId}</span>
                      <span class="expand-close-hint">
                        {props.tShell?.("chrome.expand.footerHint") ??
                          "Esc 关闭 · 双击打开 · 右键菜单"}
                      </span>
                    </>
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
                    <div
                      class="expand-footer-plugin"
                      data-tabora-plugin-id={expand().props.pluginId}
                    >
                      {FooterView(expand().props)}
                    </div>
                  </PluginViewBoundary>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </Show>
  )
}
