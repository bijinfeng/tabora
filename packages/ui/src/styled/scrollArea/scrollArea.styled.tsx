import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { ScrollArea as Primitive } from "../../primitives/scrollArea/scrollArea"
import type { ScrollAreaProps } from "../../primitives/scrollArea/scrollArea"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    maxWidth: "100%",
    overflow: "auto",
    scrollbarColor: "rgb(var(--tbr-color-line-strong)) transparent",
    scrollbarWidth: "thin",
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
    "::-webkit-scrollbar": {
      height: 6,
      width: 6,
    },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: "rgb(var(--tbr-color-line-strong))",
      borderRadius: "var(--tbr-radius-pill)",
    },
  },
})

export type StyledScrollAreaProps = ScrollAreaProps & {
  xstyle?: StyleXStyles
}

export function ScrollArea(props: StyledScrollAreaProps) {
  const compiled = () => stylex.attrs(styles.root, props.xstyle)

  return (
    <Primitive
      {...props}
      class={joinClassNames(compiled().class, props.class)}
      style={props.style}
    />
  )
}

export type { StyledScrollAreaProps as ScrollAreaProps }
