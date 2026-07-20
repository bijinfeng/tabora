import type { JSX } from "solid-js"

export type DividerProps = {
  orientation?: "horizontal" | "vertical"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
}

export function Divider(props: DividerProps) {
  return (
    <hr
      class={props.class}
      data-orientation={props.orientation ?? "horizontal"}
      aria-orientation={props.orientation ?? "horizontal"}
      style={
        props.orientation === "vertical"
          ? {
              ...props.style,
              width: "1px",
              height: "100%",
              "border-style": "none",
              "border-width": 0,
              background: "rgb(var(--tbr-color-line))",
            }
          : props.style
      }
    />
  )
}
