import * as stylex from "@stylexjs/stylex"
import { ErrorBoundary } from "solid-js"
import type { JSX } from "solid-js"
import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

const styles = stylex.create({
  fallback: {
    backgroundColor: color.surfaceSoft,
    borderColor: color.danger,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    display: "grid",
    fontSize: 12,
    gap: space.s2,
    minHeight: 96,
    padding: space.s4,
  },
  details: {
    color: color.textMuted,
    fontFamily: font.mono,
    fontSize: 11,
    margin: 0,
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
  retry: {
    alignItems: "center",
    alignSelf: "start",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontWeight: font.semibold,
    minHeight: 28,
    paddingInline: space.s4,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
})

export function createPluginErrorFallback(
  error: unknown,
  instanceId: string,
  title: string,
  copy?: {
    loadFailed: string
    retry: string
  },
  reset?: () => void,
): JSX.Element {
  return (
    <div
      {...stylex.attrs(styles.fallback)}
      role="alert"
      data-instance-id={instanceId}
      data-plugin-error-fallback
    >
      <strong>{title}</strong>
      <span>{copy?.loadFailed ?? "插件视图加载失败"}</span>
      <small>{instanceId}</small>
      <pre {...stylex.attrs(styles.details)}>
        {error instanceof Error ? error.message : String(error)}
      </pre>
      <button
        {...stylex.attrs(styles.retry)}
        data-plugin-error-retry
        type="button"
        onClick={() => reset?.()}
      >
        {copy?.retry ?? "重试"}
      </button>
    </div>
  )
}

export function PluginViewBoundary(props: {
  instanceId: string
  title: string
  children: JSX.Element
  copy?: {
    loadFailed: string
    retry: string
  }
}) {
  return (
    <ErrorBoundary
      fallback={(error, reset) =>
        createPluginErrorFallback(error, props.instanceId, props.title, props.copy, reset)
      }
    >
      {props.children}
    </ErrorBoundary>
  )
}
