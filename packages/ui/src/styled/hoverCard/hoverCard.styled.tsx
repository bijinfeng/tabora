import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { HoverCard as Primitive } from "../../primitives/hoverCard/hoverCard"
import type { HoverCardProps } from "../../primitives/hoverCard/hoverCard"
import { joinClassNames } from "../../stylex"

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
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const triggerCompiled = () => stylex.attrs(styles.trigger)
  const contentCompiled = () => stylex.attrs(styles.content)
  const mediaCompiled = () => stylex.attrs(styles.media)
  const titleCompiled = () => stylex.attrs(styles.title)
  const descriptionCompiled = () => stylex.attrs(styles.description)
  const metaCompiled = () => stylex.attrs(styles.meta)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      triggerClass={joinClassNames(triggerCompiled().class, props.triggerClass)}
      triggerStyle={props.triggerStyle}
      contentClass={joinClassNames(contentCompiled().class, props.contentClass)}
      contentStyle={props.contentStyle}
      mediaClass={joinClassNames(mediaCompiled().class, props.mediaClass)}
      mediaStyle={props.mediaStyle}
      titleClass={joinClassNames(titleCompiled().class, props.titleClass)}
      titleStyle={props.titleStyle}
      descriptionClass={joinClassNames(descriptionCompiled().class, props.descriptionClass)}
      descriptionStyle={{ ...props.descriptionStyle }}
      metaClass={joinClassNames(metaCompiled().class, props.metaClass)}
      metaStyle={props.metaStyle}
    />
  )
}

export type { StyledHoverCardProps as HoverCardProps }
