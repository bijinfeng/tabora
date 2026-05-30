export function VisuallyHidden(props: { children: string }) {
  return (
    <span
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: "0",
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        "white-space": "nowrap",
        border: "0",
      }}
    >
      {props.children}
    </span>
  )
}
