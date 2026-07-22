import * as stylex from "@stylexjs/stylex"
import { PluginViewBoundary } from "@tabora/workbench-shell"
import { X } from "lucide-solid"
import { IconButton } from "@tabora/ui"
import { createEffect, Show } from "solid-js"
import type { JSX } from "solid-js"

import type { ShellTranslation, WorkbenchShellPluginViewBoundaryCopy } from "../i18n"
import { color, motion, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"

type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

const styles = stylex.create({
  modalOverlay: {
    alignItems: "center",
    backdropFilter: "blur(2px)",
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.2)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    position: "fixed",
    zIndex: zIndex.modal,
  },
  modal: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    maxHeight: "80vh",
    maxWidth: "90vw",
    overflowY: "auto",
    position: "relative",
    width: 480,
  },
  close: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.control,
    color: color.textMuted,
    cursor: "pointer",
    display: "flex",
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, color",
    transitionTimingFunction: motion.ease,
    width: 30,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  modalBody: {
    padding: 16,
    paddingTop: 48,
  },
  fullscreen: {
    backgroundColor: color.page,
    display: "flex",
    flexDirection: "column",
    inset: 0,
    position: "fixed",
    zIndex: zIndex.overlay,
  },
  fullscreenClose: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "flex",
    height: 32,
    justifyContent: "center",
    marginBlock: 16,
    marginInline: 24,
    width: 32,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  fullscreenBody: {
    flex: 1,
    marginInline: "auto",
    maxWidth: 960,
    overflowY: "auto",
    paddingBottom: 24,
    paddingInline: 24,
    width: "100%",
  },
})

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
  let closeRef: HTMLButtonElement | undefined
  let previousFocusedElement: HTMLElement | null = null
  createEffect(() => {
    if (props.viewId) {
      previousFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      closeRef?.focus()
      return
    }
    previousFocusedElement?.focus()
    previousFocusedElement = null
  })
  return (
    <Show when={props.viewId}>
      <div
        {...stylex.attrs(styles.modalOverlay)}
        data-workbench-overlay="modal"
        onClick={props.onClose}
        onKeyDown={(event) => event.key === "Escape" && props.onClose()}
        role="dialog"
        aria-modal="true"
      >
        <div {...stylex.attrs(styles.modal)} onClick={(event) => event.stopPropagation()}>
          <IconButton
            size="sm"
            xstyle={styles.close}
            data-modal-close
            ref={(element) => (closeRef = element)}
            aria-label={props.tShell?.("chrome.modal.close") ?? "关闭"}
            onClick={props.onClose}
          >
            <X size={16} />
          </IconButton>
          <div {...stylex.attrs(styles.modalBody)}>
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
  let closeRef: HTMLButtonElement | undefined
  createEffect(() => {
    if (props.viewId) closeRef?.focus()
  })
  return (
    <Show when={props.viewId}>
      <div
        {...stylex.attrs(styles.fullscreen)}
        data-workbench-overlay="fullscreen"
        onKeyDown={(event) => event.key === "Escape" && props.onClose()}
        role="dialog"
        aria-modal="true"
      >
        <IconButton
          size="sm"
          xstyle={styles.fullscreenClose}
          data-fullscreen-close
          ref={(element) => (closeRef = element)}
          aria-label={props.tShell?.("chrome.fullscreen.close") ?? "关闭全屏视图"}
          onClick={props.onClose}
        >
          <X size={18} />
        </IconButton>
        <div {...stylex.attrs(styles.fullscreenBody)}>
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
