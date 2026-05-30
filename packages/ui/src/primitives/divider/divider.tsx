export type DividerProps = { orientation?: "horizontal" | "vertical"; class?: string }

export function Divider(props: DividerProps) {
  return (
    <hr
      class={props.class}
      data-orientation={props.orientation ?? "horizontal"}
      aria-orientation={props.orientation ?? "horizontal"}
      style={
        props.orientation === "vertical"
          ? {
              width: "1px",
              height: "100%",
              border: "none",
              background: "rgb(var(--tbr-color-line))",
            }
          : {}
      }
    />
  )
}
