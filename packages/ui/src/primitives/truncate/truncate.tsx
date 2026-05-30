import type { JSX } from "solid-js"

export type TruncateProps = { lines?: 1 | 2 | 3; class?: string; children: JSX.Element }

export function Truncate(props: TruncateProps) {
  const lines = props.lines ?? 1
  return (
    <span
      class={props.class}
      data-lines={lines}
      style={
        lines > 1
          ? {
              display: "-webkit-box",
              "-webkit-line-clamp": lines,
              "-webkit-box-orient": "vertical",
              overflow: "hidden",
            }
          : { overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }
      }
    >
      {props.children}
    </span>
  )
}
