import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"
import { Field as Primitive } from "../../primitives/field/field"
import type { FieldProps } from "../../primitives/field/field"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  inline: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    columnGap: space.s3,
    display: "grid",
    gridTemplateColumns: "48px minmax(0, 1fr)",
    minHeight: 38,
    paddingInline: 10,
    ":focus-within": {
      backgroundColor: color.surface,
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
    },
  },
  label: {
    color: color.text,
    fontSize: 12,
    fontWeight: font.semibold,
    minWidth: 0,
  },
  inlineLabel: {
    color: color.textMuted,
    fontSize: 11,
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
  inlineHelper: {
    gridColumn: "1 / -1",
  },
  error: {
    alignItems: "center",
    color: color.danger,
    display: "flex",
    fontSize: 11,
    gap: 4,
  },
  inlineError: {
    gridColumn: "1 / -1",
  },
})

export type StyledFieldProps = FieldProps & {
  xstyle?: StyleXStyles | undefined
}

export function Field(props: StyledFieldProps) {
  const inline = () => props.layout === "inline"
  const rootCompiled = () => stylex.attrs(styles.root, inline() && styles.inline, props.xstyle)
  const labelCompiled = () => stylex.attrs(styles.label, inline() && styles.inlineLabel)
  const requiredCompiled = () => stylex.attrs(styles.required)
  const helperCompiled = () => stylex.attrs(styles.helper, inline() && styles.inlineHelper)
  const errorCompiled = () => stylex.attrs(styles.error, inline() && styles.inlineError)

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
