import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import type { FormProps as PrimitiveFormProps } from "../../primitives/form"
import { Form as PrimitiveForm } from "../../primitives/form"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  vertical: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  inline: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
})

export type StyledFormProps<TFormData> = PrimitiveFormProps<TFormData> & {
  xstyle?: StyleXStyles
}

export function Form<TFormData extends Record<string, any>>(props: StyledFormProps<TFormData>) {
  const compiled = () =>
    stylex.attrs(props.layout === "inline" ? styles.inline : styles.vertical, props.xstyle)

  return (
    <PrimitiveForm
      {...props}
      class={joinClassNames(compiled().class, props.class)}
      style={props.style}
    />
  )
}

export type { StyledFormProps as FormProps }
