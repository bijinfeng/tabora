import { ErrorBoundary } from "solid-js"
import type { JSX } from "solid-js"

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
    <div class="plugin-error-fallback" role="alert" data-instance-id={instanceId}>
      <strong>{title}</strong>
      <span>{copy?.loadFailed ?? "插件视图加载失败"}</span>
      <small>{instanceId}</small>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
      <button class="plugin-error-retry-btn" type="button" onClick={() => reset?.()}>
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
