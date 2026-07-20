import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Timeline as Primitive } from "../../primitives/timeline/timeline"
import type { TimelineItem, TimelineProps } from "../../primitives/timeline/timeline"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

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
      backgroundColor: "rgb(var(--tbr-color-line))",
      bottom: 0,
      content: '""',
      left: 5,
      position: "absolute",
      top: 14,
      width: 2,
    },
  },
  dot: {
    backgroundColor: "rgb(var(--tbr-color-line-strong))",
    borderRadius: "var(--tbr-radius-pill)",
    flex: "none",
    height: 10,
    marginTop: 4,
    width: 10,
    zIndex: 1,
  },
  body: {
    color: "rgb(var(--tbr-color-text))",
    display: "grid",
    fontSize: 13,
    gap: 2,
    minWidth: 0,
  },
  description: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 11,
    lineHeight: 1.45,
  },
  meta: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
  },
})

export type StyledTimelineProps = TimelineProps & {
  xstyle?: StyleXStyles
}

export function Timeline(props: StyledTimelineProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const itemCompiled = () => stylex.props(styles.item)
  const dotCompiled = () => stylex.props(styles.dot)
  const bodyCompiled = () => stylex.props(styles.body)
  const descriptionCompiled = () => stylex.props(styles.description)
  const metaCompiled = () => stylex.props(styles.meta)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      itemClass={joinClassNames(itemCompiled().className, props.itemClass)}
      itemStyle={mergeSolidStyles(toSolidStyle(itemCompiled().style), props.itemStyle)}
      dotClass={joinClassNames(dotCompiled().className, props.dotClass)}
      dotStyle={mergeSolidStyles(toSolidStyle(dotCompiled().style), props.dotStyle)}
      bodyClass={joinClassNames(bodyCompiled().className, props.bodyClass)}
      bodyStyle={mergeSolidStyles(toSolidStyle(bodyCompiled().style), props.bodyStyle)}
      descriptionClass={joinClassNames(descriptionCompiled().className, props.descriptionClass)}
      descriptionStyle={mergeSolidStyles(
        toSolidStyle(descriptionCompiled().style),
        props.descriptionStyle,
      )}
      metaClass={joinClassNames(metaCompiled().className, props.metaClass)}
      metaStyle={mergeSolidStyles(toSolidStyle(metaCompiled().style), props.metaStyle)}
    />
  )
}

export type { TimelineItem, StyledTimelineProps as TimelineProps }
