import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { EmptyState as Primitive } from "../../primitives/emptyState/emptyState"
import type { EmptyStateProps } from "../../primitives/emptyState/emptyState"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    justifyContent: "center",
    paddingBlock: 20,
    paddingInline: 12,
    textAlign: "center",
  },
  compact: {
    gap: 4,
    padding: 12,
  },
  title: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    lineHeight: 1.4,
    maxWidth: 220,
  },
  description: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 12,
    lineHeight: 1.4,
    maxWidth: 220,
  },
  action: {
    marginTop: 4,
  },
})

export type StyledEmptyStateProps = EmptyStateProps & {
  xstyle?: StyleXStyles
}

export function EmptyState(props: StyledEmptyStateProps) {
  const rootCompiled = () =>
    stylex.props(styles.root, props.compact && styles.compact, props.xstyle)
  const titleCompiled = () => stylex.props(styles.title)
  const descriptionCompiled = () => stylex.props(styles.description)
  const actionCompiled = () => stylex.props(styles.action)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      titleClass={joinClassNames(titleCompiled().className, props.titleClass)}
      titleStyle={mergeSolidStyles(toSolidStyle(titleCompiled().style), props.titleStyle)}
      descriptionClass={joinClassNames(descriptionCompiled().className, props.descriptionClass)}
      descriptionStyle={mergeSolidStyles(
        toSolidStyle(descriptionCompiled().style),
        props.descriptionStyle,
      )}
      actionClass={joinClassNames(actionCompiled().className, props.actionClass)}
      actionStyle={mergeSolidStyles(toSolidStyle(actionCompiled().style), props.actionStyle)}
    />
  )
}

export type { StyledEmptyStateProps as EmptyStateProps }
