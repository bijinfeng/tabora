import { Skeleton as P, SkeletonText as PT } from "../../primitives/skeleton/skeleton"
import type { SkeletonProps } from "../../primitives/skeleton/skeleton"
import "./styles.css"
export function Skeleton(props: SkeletonProps) {
  return <P {...props} class={`tbr-skeleton ${props.class ?? ""}`} />
}
export function SkeletonText(props: { lines?: number; class?: string }) {
  return <PT {...props} class={`tbr-skeleton ${props.class ?? ""}`} />
}
export type { SkeletonProps }
