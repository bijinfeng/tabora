import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import type { DeepKeys } from "@tanstack/solid-form"
import { Show } from "solid-js"
import type { Accessor, JSX } from "solid-js"

import type { FormItemProps as PrimitiveFormItemProps } from "../../primitives/form"
import { FormItem as PrimitiveFormItem, hasFieldName } from "../../primitives/form"
import { Field } from "../field"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  slot: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
})

export type StyledFormItemProps<
  TFormData extends Record<string, any>,
  TName extends DeepKeys<TFormData>,
> = PrimitiveFormItemProps<TFormData, TName> & {
  xstyle?: StyleXStyles
}

/** 表单行：无 label 时只做行容器，有 label 时套用 Field 的 label / help / error 视觉。 */
export function FormItem<TFormData extends Record<string, any>, TName extends DeepKeys<TFormData>>(
  props: StyledFormItemProps<TFormData, TName>,
) {
  const slotCompiled = () => stylex.attrs(styles.slot, props.xstyle)

  const wrap = (content: JSX.Element, error?: Accessor<JSX.Element>) => (
    <Show
      when={props.label !== undefined}
      fallback={
        <div class={joinClassNames(slotCompiled().class, props.class)} style={props.style}>
          {content}
        </div>
      }
    >
      <Field
        label={props.label}
        required={hasFieldName(props) ? props.required : undefined}
        helper={props.help}
        error={error?.()}
        htmlFor={props.htmlFor}
        xstyle={props.xstyle}
        class={props.class}
        style={props.style}
      >
        {content}
      </Field>
    </Show>
  )

  if (!hasFieldName(props)) {
    return wrap(props.children())
  }

  const fieldProps = props

  return (
    <PrimitiveFormItem
      {...fieldProps}
      children={(field) =>
        wrap(fieldProps.children(field), () => field().state.meta.errors[0] as JSX.Element)
      }
    />
  )
}

export type { StyledFormItemProps as FormItemProps }
