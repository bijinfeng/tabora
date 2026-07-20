import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { CardSection as Primitive } from "../../primitives/cardSection/cardSection"
import type { CardSectionProps } from "../../primitives/cardSection/cardSection"

const styles = stylex.create({
  root: {
    backgroundColor: "inherit",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    justifyContent: "space-between",
    paddingBlock: 8,
    paddingInline: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: 650,
    margin: 0,
  },
  trailing: {
    alignItems: "center",
    display: "flex",
  },
  body: {
    padding: 10,
  },
})

export type StyledCardSectionProps = Omit<
  CardSectionProps,
  | "attrs"
  | "class"
  | "style"
  | "headerAttrs"
  | "headerClass"
  | "headerStyle"
  | "titleAttrs"
  | "titleClass"
  | "titleStyle"
  | "trailingAttrs"
  | "trailingClass"
  | "trailingStyle"
  | "bodyAttrs"
  | "bodyClass"
  | "bodyStyle"
> & {
  xstyle?: StyleXStyles
}

export function CardSection(props: StyledCardSectionProps) {
  const rootAttrs = () => stylex.attrs(styles.root, props.xstyle)
  const headerAttrs = () => stylex.attrs(styles.header)
  const titleAttrs = () => stylex.attrs(styles.title)
  const trailingAttrs = () => stylex.attrs(styles.trailing)
  const bodyAttrs = () => stylex.attrs(styles.body)

  return (
    <Primitive
      {...props}
      attrs={rootAttrs()}
      headerAttrs={headerAttrs()}
      titleAttrs={titleAttrs()}
      trailingAttrs={trailingAttrs()}
      bodyAttrs={bodyAttrs()}
    />
  )
}

export type { StyledCardSectionProps as CardSectionProps }
