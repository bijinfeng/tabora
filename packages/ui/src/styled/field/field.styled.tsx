import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Field as Primitive } from "../../primitives/field/field"
import type { FieldProps } from "../../primitives/field/field"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 12,
    fontWeight: 650,
  },
  required: {
    color: "rgb(var(--tbr-color-danger))",
    marginLeft: 2,
  },
  helper: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 11,
    lineHeight: 1.4,
  },
  error: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-danger))",
    display: "flex",
    fontSize: 11,
    gap: 4,
  },
})

export type StyledFieldProps = FieldProps & {
  xstyle?: StyleXStyles
}

export function Field(props: StyledFieldProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const labelCompiled = () => stylex.props(styles.label)
  const requiredCompiled = () => stylex.props(styles.required)
  const helperCompiled = () => stylex.props(styles.helper)
  const errorCompiled = () => stylex.props(styles.error)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      labelClass={joinClassNames(labelCompiled().className, props.labelClass)}
      labelStyle={mergeSolidStyles(toSolidStyle(labelCompiled().style), props.labelStyle)}
      requiredClass={joinClassNames(requiredCompiled().className, props.requiredClass)}
      requiredStyle={mergeSolidStyles(toSolidStyle(requiredCompiled().style), props.requiredStyle)}
      helperClass={joinClassNames(helperCompiled().className, props.helperClass)}
      helperStyle={mergeSolidStyles(toSolidStyle(helperCompiled().style), props.helperStyle)}
      errorClass={joinClassNames(errorCompiled().className, props.errorClass)}
      errorStyle={mergeSolidStyles(toSolidStyle(errorCompiled().style), props.errorStyle)}
    />
  )
}

export type { StyledFieldProps as FieldProps }
