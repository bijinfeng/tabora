import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius } from "@tabora/theme/tokens.stylex"
import { ListRow as Primitive } from "../../primitives/listRow/listRow"
import type { ListRowProps } from "../../primitives/listRow/listRow"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: "inherit",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 13,
    gap: 10,
    minHeight: 36,
    paddingBlock: 8,
    paddingInline: 12,
    textAlign: "inherit",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
  },
  interactive: {
    cursor: "pointer",
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.line,
    },
  },
  selected: {
    backgroundColor: color.accentSoft,
    borderColor: color.accent,
  },
  divider: {
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    borderRadius: 0,
  },
  leading: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  primary: {
    fontSize: 13,
  },
  primaryDanger: {
    color: color.danger,
  },
  secondary: {
    color: color.textSubtle,
    fontSize: 11,
    marginTop: 1,
  },
  trailing: {
    alignItems: "center",
    color: color.textSubtle,
    display: "flex",
    flexShrink: 0,
    fontSize: 11,
  },
})

export type StyledListRowProps = ListRowProps & {
  xstyle?: StyleXStyles
}

export function ListRow(props: StyledListRowProps) {
  const rootCompiled = () =>
    stylex.attrs(
      styles.root,
      props.interactive === true && styles.interactive,
      props.interactive === undefined && props.onClick !== undefined && styles.interactive,
      props.selected && styles.selected,
      props.divider && styles.divider,
      props.xstyle,
    )
  const leadingCompiled = () => stylex.attrs(styles.leading)
  const mainCompiled = () => stylex.attrs(styles.main)
  const primaryCompiled = () => stylex.attrs(styles.primary, props.danger && styles.primaryDanger)
  const secondaryCompiled = () => stylex.attrs(styles.secondary)
  const trailingCompiled = () => stylex.attrs(styles.trailing)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      leadingClass={joinClassNames(leadingCompiled().class, props.leadingClass)}
      leadingStyle={props.leadingStyle}
      mainClass={joinClassNames(mainCompiled().class, props.mainClass)}
      mainStyle={props.mainStyle}
      primaryClass={joinClassNames(primaryCompiled().class, props.primaryClass)}
      primaryStyle={props.primaryStyle}
      secondaryClass={joinClassNames(secondaryCompiled().class, props.secondaryClass)}
      secondaryStyle={{ ...props.secondaryStyle }}
      trailingClass={joinClassNames(trailingCompiled().class, props.trailingClass)}
      trailingStyle={props.trailingStyle}
    />
  )
}

export type { StyledListRowProps as ListRowProps }
