import { ErrorBoundary } from "solid-js"
import type { JSX } from "solid-js"

export type LayoutBoundaryProps = {
  fallback: JSX.Element
  onError?: (error: unknown) => void
  children: JSX.Element
}

export function LayoutBoundary(props: LayoutBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error) => {
        props.onError?.(error)
        return props.fallback
      }}
    >
      {props.children}
    </ErrorBoundary>
  )
}
