import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font } from "@tabora/theme/tokens.stylex"
import { Field as Primitive } from "../../primitives/field/field"
import type { FieldProps } from "../../primitives/field/field"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    color: color.text,
    fontSize: 12,
    fontWeight: font.semibold,
  },
  required: {
    color: color.danger,
    marginLeft: 2,
  },
  helper: {
    color: color.textMuted,
    fontSize: 11,
    lineHeight: 1.4,
  },
  error: {
    alignItems: "center",
    color: color.danger,
    display: "flex",
    fontSize: 11,
    gap: 4,
  },
})

export type StyledFieldProps = FieldProps & {
  xstyle?: StyleXStyles
}

export function Field(props: StyledFieldProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const labelCompiled = () => stylex.attrs(styles.label)
  const requiredCompiled = () => stylex.attrs(styles.required)
  const helperCompiled = () => stylex.attrs(styles.helper)
  const errorCompiled = () => stylex.attrs(styles.error)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      labelClass={joinClassNames(labelCompiled().class, props.labelClass)}
      labelStyle={props.labelStyle}
      requiredClass={joinClassNames(requiredCompiled().class, props.requiredClass)}
      requiredStyle={props.requiredStyle}
      helperClass={joinClassNames(helperCompiled().class, props.helperClass)}
      helperStyle={props.helperStyle}
      errorClass={joinClassNames(errorCompiled().class, props.errorClass)}
      errorStyle={props.errorStyle}
    />
  )
}

export type { StyledFieldProps as FieldProps }
