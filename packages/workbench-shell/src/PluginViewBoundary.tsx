import { ErrorBoundary } from "solid-js"
import type { JSX } from "solid-js"

export function createPluginErrorFallback(
  error: unknown,
  instanceId: string,
  title: string,
  reset?: () => void,
): JSX.Element {
  return (
    <div class="plugin-error-fallback" role="alert" data-instance-id={instanceId}>
      <strong>{title}</strong>
      <span>插件视图加载失败</span>
      <small>{instanceId}</small>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
      <button class="plugin-error-retry-btn" type="button" onClick={() => reset?.()}>
        重试
      </button>
    </div>
  )
}

export function PluginViewBoundary(props: {
  instanceId: string
  title: string
  children: JSX.Element
}) {
  return (
    <ErrorBoundary
      fallback={(error, reset) =>
        createPluginErrorFallback(error, props.instanceId, props.title, reset)
      }
    >
      {props.children}
    </ErrorBoundary>
  )
}
