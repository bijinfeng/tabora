import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, radius } from "@tabora/theme/tokens.stylex"
import { Timeline as Primitive } from "../../primitives/timeline/timeline"
import type { TimelineItem, TimelineProps } from "../../primitives/timeline/timeline"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    display: "flex",
    gap: 9,
    paddingBottom: 10,
    position: "relative",
    ":not(:last-child)::before": {
      backgroundColor: color.line,
      bottom: 0,
      content: '""',
      left: 5,
      position: "absolute",
      top: 14,
      width: 2,
    },
  },
  dot: {
    backgroundColor: color.lineStrong,
    borderRadius: radius.pill,
    flex: "none",
    height: 10,
    marginTop: 4,
    width: 10,
    zIndex: 1,
  },
  body: {
    color: color.text,
    display: "grid",
    fontSize: 13,
    gap: 2,
    minWidth: 0,
  },
  description: {
    color: color.textMuted,
    fontSize: 11,
    lineHeight: 1.45,
  },
  meta: {
    color: color.textSubtle,
    fontSize: 10,
  },
})

export type StyledTimelineProps = Omit<
  TimelineProps,
  | "attrs"
  | "class"
  | "style"
  | "itemAttrs"
  | "itemClass"
  | "itemStyle"
  | "dotAttrs"
  | "dotClass"
  | "dotStyle"
  | "bodyAttrs"
  | "bodyClass"
  | "bodyStyle"
  | "titleAttrs"
  | "titleClass"
  | "titleStyle"
  | "descriptionAttrs"
  | "descriptionClass"
  | "descriptionStyle"
  | "metaAttrs"
  | "metaClass"
  | "metaStyle"
> & {
  xstyle?: StyleXStyles
}

export function Timeline(props: StyledTimelineProps) {
  const rootAttrs = () => stylex.attrs(styles.root, props.xstyle)
  const itemAttrs = () => stylex.attrs(styles.item)
  const dotAttrs = () => stylex.attrs(styles.dot)
  const bodyAttrs = () => stylex.attrs(styles.body)
  const descriptionAttrs = () => stylex.attrs(styles.description)
  const metaAttrs = () => stylex.attrs(styles.meta)

  return (
    <Primitive
      {...props}
      attrs={rootAttrs()}
      itemAttrs={itemAttrs()}
      dotAttrs={dotAttrs()}
      bodyAttrs={bodyAttrs()}
      descriptionAttrs={descriptionAttrs()}
      metaAttrs={metaAttrs()}
    />
  )
}

export type { TimelineItem, StyledTimelineProps as TimelineProps }
