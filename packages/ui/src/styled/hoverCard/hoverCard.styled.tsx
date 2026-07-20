import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { HoverCard as Primitive } from "../../primitives/hoverCard/hoverCard"
import type { HoverCardProps } from "../../primitives/hoverCard/hoverCard"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const scaleIn = stylex.keyframes({
  from: {
    opacity: 0,
    transform: "scale(0.98)",
  },
  to: {
    opacity: 1,
    transform: "scale(1)",
  },
})

const styles = stylex.create({
  root: {
    display: "inline-flex",
  },
  trigger: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-accent))",
    display: "inline-flex",
    fontSize: 13,
    fontWeight: 600,
    minHeight: 24,
    paddingBlock: 2,
    paddingInline: 8,
  },
  content: {
    animationDuration: "120ms",
    animationName: scaleIn,
    animationTimingFunction: "var(--tbr-ease)",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow:
      "0 4px 16px rgb(var(--tbr-color-shadow) / 0.08), 0 0 1px rgb(var(--tbr-color-shadow) / 0.06)",
    color: "rgb(var(--tbr-color-text))",
    display: "grid",
    gap: 6,
    padding: 10,
    width: 250,
    zIndex: 55,
  },
  media: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderRadius: "var(--tbr-radius-control)",
    display: "flex",
    justifyContent: "center",
    minHeight: 58,
  },
  title: {
    fontSize: 12,
    fontWeight: 650,
  },
  description: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 11,
    lineHeight: 1.35,
  },
  meta: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
  },
})

export type StyledHoverCardProps = HoverCardProps & {
  xstyle?: StyleXStyles
}

export function HoverCard(props: StyledHoverCardProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const triggerCompiled = () => stylex.props(styles.trigger)
  const contentCompiled = () => stylex.props(styles.content)
  const mediaCompiled = () => stylex.props(styles.media)
  const titleCompiled = () => stylex.props(styles.title)
  const descriptionCompiled = () => stylex.props(styles.description)
  const metaCompiled = () => stylex.props(styles.meta)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      triggerClass={joinClassNames(triggerCompiled().className, props.triggerClass)}
      triggerStyle={mergeSolidStyles(toSolidStyle(triggerCompiled().style), props.triggerStyle)}
      contentClass={joinClassNames(contentCompiled().className, props.contentClass)}
      contentStyle={mergeSolidStyles(toSolidStyle(contentCompiled().style), props.contentStyle)}
      mediaClass={joinClassNames(mediaCompiled().className, props.mediaClass)}
      mediaStyle={mergeSolidStyles(toSolidStyle(mediaCompiled().style), props.mediaStyle)}
      titleClass={joinClassNames(titleCompiled().className, props.titleClass)}
      titleStyle={mergeSolidStyles(toSolidStyle(titleCompiled().style), props.titleStyle)}
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

export type { StyledHoverCardProps as HoverCardProps }
