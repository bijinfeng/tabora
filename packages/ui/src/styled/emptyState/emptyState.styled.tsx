import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color } from "@tabora/theme/tokens.stylex"
import { EmptyState as Primitive } from "../../primitives/emptyState/emptyState"
import type { EmptyStateProps } from "../../primitives/emptyState/emptyState"
import { joinClassNames } from "../../stylex"

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
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 1.4,
    maxWidth: 220,
  },
  description: {
    color: color.textSubtle,
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
    stylex.attrs(styles.root, props.compact && styles.compact, props.xstyle)
  const titleCompiled = () => stylex.attrs(styles.title)
  const descriptionCompiled = () => stylex.attrs(styles.description)
  const actionCompiled = () => stylex.attrs(styles.action)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      titleClass={joinClassNames(titleCompiled().class, props.titleClass)}
      titleStyle={props.titleStyle}
      descriptionClass={joinClassNames(descriptionCompiled().class, props.descriptionClass)}
      descriptionStyle={{ ...props.descriptionStyle }}
      actionClass={joinClassNames(actionCompiled().class, props.actionClass)}
      actionStyle={props.actionStyle}
    />
  )
}

export type { StyledEmptyStateProps as EmptyStateProps }
