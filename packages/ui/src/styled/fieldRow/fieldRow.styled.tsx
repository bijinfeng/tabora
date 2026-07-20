import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { FieldRow as Primitive } from "../../primitives/fieldRow/fieldRow"
import type { FieldRowProps } from "../../primitives/fieldRow/fieldRow"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

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
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const mainCompiled = () => stylex.props(styles.main)
  const infoCompiled = () => stylex.props(styles.info)
  const labelCompiled = () => stylex.props(styles.label)
  const descriptionCompiled = () => stylex.props(styles.description)
  const trailingCompiled = () => stylex.props(styles.trailing)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      mainClass={joinClassNames(mainCompiled().className, props.mainClass)}
      mainStyle={mergeSolidStyles(toSolidStyle(mainCompiled().style), props.mainStyle)}
      infoClass={joinClassNames(infoCompiled().className, props.infoClass)}
      infoStyle={mergeSolidStyles(toSolidStyle(infoCompiled().style), props.infoStyle)}
      labelClass={joinClassNames(labelCompiled().className, props.labelClass)}
      labelStyle={mergeSolidStyles(toSolidStyle(labelCompiled().style), props.labelStyle)}
      descriptionClass={joinClassNames(descriptionCompiled().className, props.descriptionClass)}
      descriptionStyle={mergeSolidStyles(
        toSolidStyle(descriptionCompiled().style),
        props.descriptionStyle,
      )}
      trailingClass={joinClassNames(trailingCompiled().className, props.trailingClass)}
      trailingStyle={mergeSolidStyles(toSolidStyle(trailingCompiled().style), props.trailingStyle)}
      helperClass={joinClassNames(descriptionCompiled().className, props.helperClass)}
      helperStyle={mergeSolidStyles(toSolidStyle(descriptionCompiled().style), props.helperStyle)}
    />
  )
}

export type { StyledFieldRowProps as FieldRowProps }
