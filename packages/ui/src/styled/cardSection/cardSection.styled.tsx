import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"
import { CardSection as Primitive } from "../../primitives/cardSection/cardSection"
import type { CardSectionProps } from "../../primitives/cardSection/cardSection"

const styles = stylex.create({
  root: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
    overflow: "hidden",
    padding: space.s5,
  },
  header: {
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: font.semibold,
    margin: 0,
  },
  description: {
    color: color.textMuted,
    fontSize: 12,
    margin: 0,
    marginTop: space.s1,
  },
  trailing: {
    alignItems: "center",
    display: "flex",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
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
  | "descriptionAttrs"
  | "descriptionClass"
  | "descriptionStyle"
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
  const descriptionAttrs = () => stylex.attrs(styles.description)
  const trailingAttrs = () => stylex.attrs(styles.trailing)
  const bodyAttrs = () => stylex.attrs(styles.body)

  return (
    <Primitive
      {...props}
      attrs={rootAttrs()}
      headerAttrs={headerAttrs()}
      titleAttrs={titleAttrs()}
      descriptionAttrs={descriptionAttrs()}
      trailingAttrs={trailingAttrs()}
      bodyAttrs={bodyAttrs()}
    />
  )
}

export type { StyledCardSectionProps as CardSectionProps }
