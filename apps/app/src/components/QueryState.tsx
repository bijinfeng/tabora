import { InlineError } from "@tabora/ui/inline-error"
import type { JSX } from "solid-js"
import { Show } from "solid-js"

type QueryStateProps = {
  error?: Error | null | undefined
  errorMessage?: string
  loading: boolean
  hasRows: boolean
  empty: JSX.Element
  children: JSX.Element
}

export function QueryState(props: QueryStateProps) {
  return (
    <Show
      when={!props.error}
      fallback={
        <InlineError>{props.error?.message ?? props.errorMessage ?? "加载失败"}</InlineError>
      }
    >
      <Show when={props.loading || props.hasRows} fallback={props.empty}>
        {props.children}
      </Show>
    </Show>
  )
}
