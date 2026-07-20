import * as stylex from "@stylexjs/stylex"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { PluginViewBoundary } from "@tabora/workbench-shell"
import { X } from "lucide-solid"
import { createEffect, Show } from "solid-js"
import type { JSX } from "solid-js"

import type { ShellTranslation, WorkbenchShellPluginViewBoundaryCopy } from "../i18n"
import { color, font, motion, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"
import type { SolidView } from "./WorkbenchShellChrome.types"
import type { WorkbenchExpandState } from "./WorkbenchShellInteractions"

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const scaleIn = stylex.keyframes({
  from: { opacity: 0, transform: "scale(0.97) translateY(8px)" },
  to: { opacity: 1, transform: "scale(1) translateY(0)" },
})

const styles = stylex.create({
  overlay: {
    alignItems: "center",
    animationDuration: motion.normal,
    animationName: fadeIn,
    animationTimingFunction: motion.ease,
    backdropFilter: "blur(4px)",
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.16)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    padding: 24,
    position: "fixed",
    zIndex: zIndex.overlay,
    "@media (max-width: 480px)": {
      padding: 12,
    },
    "@media (prefers-reduced-motion: reduce)": {
      animationDuration: "1ms",
    },
  },
  shell: {
    animationDuration: motion.normal,
    animationName: scaleIn,
    animationTimingFunction: motion.ease,
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    display: "flex",
    flexDirection: "column",
    maxHeight: "calc(100vh - 64px)",
    minHeight: "min(440px, calc(100vh - 64px))",
    overflow: "hidden",
    width: "min(920px, calc(100vw - 64px))",
    "@media (max-width: 480px)": {
      maxHeight: "calc(100vh - 24px)",
      minHeight: "min(440px, calc(100vh - 24px))",
      width: "calc(100vw - 24px)",
    },
    "@media (prefers-reduced-motion: reduce)": {
      animationDuration: "1ms",
    },
  },
  header: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    paddingBlock: 10,
    paddingInline: 12,
  },
  title: {
    alignItems: "center",
    display: "flex",
    gap: 8,
    minWidth: 0,
  },
  titleIcon: {
    alignItems: "center",
    backgroundColor: color.accentSoft,
    borderRadius: radius.control,
    color: color.accent,
    display: "inline-flex",
    flexShrink: 0,
    fontSize: 12,
    fontWeight: font.bold,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  titleTexts: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    minWidth: 0,
  },
  titleText: {
    fontSize: 14,
    fontWeight: font.bold,
    lineHeight: 1.25,
  },
  titleMeta: {
    color: color.textSubtle,
    fontSize: 10,
    lineHeight: 1.2,
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
  body: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
  },
  missing: {
    color: color.danger,
    fontSize: 13,
    padding: 12,
  },
  footer: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderTopColor: color.line,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    color: color.textMuted,
    display: "flex",
    fontSize: 12,
    gap: 12,
    justifyContent: "space-between",
    paddingBlock: 8,
    paddingInline: 16,
  },
  pluginFooter: {
    minWidth: 0,
    width: "100%",
  },
  footerWithPlugin: {
    backgroundColor: color.surface,
    padding: 0,
  },
  meta: {
    fontFamily: font.mono,
    fontSize: 11,
  },
  hint: {
    whiteSpace: "nowrap",
  },
})

export function WorkbenchExpandOverlay(props: {
  expandState: WorkbenchExpandState | null
  getView: (viewId: string) => SolidView<WidgetViewProps> | undefined
  widgetIconForProps: (props: WidgetViewProps) => JSX.Element
  onClose: () => void
  tShell?: ShellTranslation
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  let closeButtonRef: HTMLButtonElement | undefined
  let previousFocusedElement: HTMLElement | null = null

  createEffect(() => {
    if (props.expandState) {
      previousFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      closeButtonRef?.focus()
      return
    }
    previousFocusedElement?.focus()
    previousFocusedElement = null
  })

  return (
    <Show when={props.expandState}>
      {(expand) => (
        <div
          {...stylex.props(styles.overlay)}
          data-workbench-overlay="expand"
          onClick={props.onClose}
          onKeyDown={(event) => event.key === "Escape" && props.onClose()}
          role="dialog"
          aria-modal="true"
          aria-label={expand().title}
        >
          <div {...stylex.props(styles.shell)} onClick={(event) => event.stopPropagation()}>
            <div {...stylex.props(styles.header)}>
              <div {...stylex.props(styles.title)}>
                <span {...stylex.props(styles.titleIcon)}>
                  {props.widgetIconForProps(expand().props)}
                </span>
                <div {...stylex.props(styles.titleTexts)}>
                  <span {...stylex.props(styles.titleText)}>{expand().title}</span>
                  <span {...stylex.props(styles.titleMeta)}>
                    {expand().mode === "settings"
                      ? (props.tShell?.("chrome.expand.meta.settings") ?? "实例设置")
                      : (props.tShell?.("chrome.expand.meta.expand") ?? "插件展开视图")}
                  </span>
                </div>
              </div>
              <button
                {...stylex.props(styles.close)}
                type="button"
                ref={(element) => (closeButtonRef = element)}
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
            <div {...stylex.props(styles.body)}>
              {(() => {
                const View = props.getView(expand().viewId)
                if (!View) {
                  return (
                    <div {...stylex.props(styles.missing)} role="alert">
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
            <div
              {...stylex.props(
                styles.footer,
                Boolean(expand().footerViewId) && styles.footerWithPlugin,
              )}
              data-workbench-overlay-footer
            >
              {(() => {
                const footerViewId = expand().footerViewId
                const FooterView = footerViewId ? props.getView(footerViewId) : undefined
                if (!FooterView) {
                  return (
                    <>
                      <span {...stylex.props(styles.meta)} data-workbench-overlay-meta>
                        {expand().instanceId}
                      </span>
                      <span {...stylex.props(styles.hint)} data-workbench-overlay-close-hint>
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
                      {...stylex.props(styles.pluginFooter)}
                      data-workbench-overlay-plugin-footer
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
