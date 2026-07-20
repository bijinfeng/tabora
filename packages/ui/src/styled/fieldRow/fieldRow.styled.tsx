import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { FieldRow as Primitive } from "../../primitives/fieldRow/fieldRow"
import type { FieldRowProps } from "../../primitives/fieldRow/fieldRow"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingBlock: 10,
    paddingInline: 0,
  },
  main: {
    alignItems: "center",
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
  },
  info: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  label: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 13,
    fontWeight: 600,
  },
  description: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 12,
    lineHeight: 1.4,
  },
  trailing: {
    alignItems: "center",
    display: "inline-flex",
    flexShrink: 0,
    gap: 8,
  },
})

export type StyledFieldRowProps = FieldRowProps & {
  xstyle?: StyleXStyles
}

export function FieldRow(props: StyledFieldRowProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const mainCompiled = () => stylex.attrs(styles.main)
  const infoCompiled = () => stylex.attrs(styles.info)
  const labelCompiled = () => stylex.attrs(styles.label)
  const descriptionCompiled = () => stylex.attrs(styles.description)
  const trailingCompiled = () => stylex.attrs(styles.trailing)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      mainClass={joinClassNames(mainCompiled().class, props.mainClass)}
      mainStyle={props.mainStyle}
      infoClass={joinClassNames(infoCompiled().class, props.infoClass)}
      infoStyle={props.infoStyle}
      labelClass={joinClassNames(labelCompiled().class, props.labelClass)}
      labelStyle={props.labelStyle}
      descriptionClass={joinClassNames(descriptionCompiled().class, props.descriptionClass)}
      descriptionStyle={{ ...props.descriptionStyle }}
      trailingClass={joinClassNames(trailingCompiled().class, props.trailingClass)}
      trailingStyle={props.trailingStyle}
      helperClass={joinClassNames(descriptionCompiled().class, props.helperClass)}
      helperStyle={props.helperStyle}
    />
  )
}

export type { StyledFieldRowProps as FieldRowProps }
