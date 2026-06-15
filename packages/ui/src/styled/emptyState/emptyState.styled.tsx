import { EmptyState as Primitive } from "../../primitives/emptyState/emptyState"
import type { EmptyStateProps } from "../../primitives/emptyState/emptyState"
import "./styles.css"

export function EmptyState(props: EmptyStateProps) {
  return <Primitive {...props} class={`tbr-empty-state ${props.class ?? ""}`.trim()} />
}

export type { EmptyStateProps }
