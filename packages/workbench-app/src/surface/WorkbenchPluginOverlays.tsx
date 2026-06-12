import { PluginViewBoundary } from "@tabora/workbench-shell"
import { X } from "lucide-solid"
import { Show } from "solid-js"
import type { JSX } from "solid-js"

import type { ShellTranslation, WorkbenchShellPluginViewBoundaryCopy } from "../i18n"

type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

function resolvePluginBoundaryId(props: Record<string, unknown>, fallback: string): string {
  return typeof props.instanceId === "string" ? props.instanceId : fallback
}

function resolvePluginScopeId(props: Record<string, unknown>): string | undefined {
  return typeof props.pluginId === "string" ? props.pluginId : undefined
}

function WorkbenchPluginSurfaceView(props: {
  viewId: string
  viewProps: Record<string, unknown>
  getView: (viewId: string) => SolidView | undefined
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  const View = props.getView(props.viewId)
  if (!View) return null

  return (
    <PluginViewBoundary
      instanceId={resolvePluginBoundaryId(props.viewProps, props.viewId)}
      title={props.viewId}
      {...(props.pluginViewBoundaryCopy ? { copy: props.pluginViewBoundaryCopy } : {})}
    >
      <div data-tabora-plugin-id={resolvePluginScopeId(props.viewProps)}>
        {View(props.viewProps)}
      </div>
    </PluginViewBoundary>
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
            <Show when={props.viewId}>
              {(viewId) => (
                <WorkbenchPluginSurfaceView
                  viewId={viewId()}
                  viewProps={props.modalProps}
                  getView={props.getView}
                  {...(props.pluginViewBoundaryCopy
                    ? { pluginViewBoundaryCopy: props.pluginViewBoundaryCopy }
                    : {})}
                />
              )}
            </Show>
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
          <Show when={props.viewId}>
            {(viewId) => (
              <WorkbenchPluginSurfaceView
                viewId={viewId()}
                viewProps={props.fullscreenProps}
                getView={props.getView}
                {...(props.pluginViewBoundaryCopy
                  ? { pluginViewBoundaryCopy: props.pluginViewBoundaryCopy }
                  : {})}
              />
            )}
          </Show>
        </div>
      </div>
    </Show>
  )
}
