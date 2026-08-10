import type { DeepKeys, DeepValue, FieldApi } from "@tanstack/solid-form"
import type { JSX } from "solid-js"

import { useFormContext } from "./form"

/** 不带字段级 async validator 的 FieldApi。 */
export type SimpleFieldApi<TFormData, TName extends DeepKeys<TFormData>> = FieldApi<
  TFormData,
  TName,
  DeepValue<TFormData, TName>,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
>

type FieldValidator<TFormData, TName extends DeepKeys<TFormData>> =
  | ((params: {
      value: DeepValue<TFormData, TName>
      fieldApi: SimpleFieldApi<TFormData, TName>
    }) => string | undefined)
  | undefined

export type FormItemValidators<TFormData, TName extends DeepKeys<TFormData>> = {
  onMount?: FieldValidator<TFormData, TName>
  onChange?: FieldValidator<TFormData, TName>
  onBlur?: FieldValidator<TFormData, TName>
  onSubmit?: FieldValidator<TFormData, TName>
}

/** 布局插槽：不绑定字段，只复用表单行间距与 label/help 结构（例如提交按钮）。 */
export type FormItemSlotProps = {
  name?: undefined
  label?: JSX.Element
  htmlFor?: string | undefined
  help?: JSX.Element
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  children: () => JSX.Element
}

export type FormItemFieldProps<TFormData, TName extends DeepKeys<TFormData>> = {
  name: TName
  label?: JSX.Element
  /** 关联 label 与真实控件的 id；控件 id 由调用方决定，不自动推导。 */
  htmlFor?: string | undefined
  required?: boolean
  help?: JSX.Element
  validators?: FormItemValidators<TFormData, TName> | undefined
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  children: (field: () => SimpleFieldApi<TFormData, TName>) => JSX.Element
}

export type FormItemProps<
  TFormData extends Record<string, any>,
  TName extends DeepKeys<TFormData>,
> = FormItemFieldProps<TFormData, TName> | FormItemSlotProps

export function hasFieldName<
  TFormData extends Record<string, any>,
  TName extends DeepKeys<TFormData>,
>(props: FormItemProps<TFormData, TName>): props is FormItemFieldProps<TFormData, TName> {
  return props.name !== undefined
}

/**
 * 绑定表单字段并把 field accessor 交给 children；不产生任何包裹元素或视觉样式。
 * 无 `name` 时按布局插槽渲染 —— form-core 会把 name 当作路径解析，传 undefined 会直接抛错。
 */
export function FormItem<TFormData extends Record<string, any>, TName extends DeepKeys<TFormData>>(
  props: FormItemProps<TFormData, TName>,
) {
  const form = useFormContext<TFormData>()

  if (!hasFieldName(props)) {
    return <>{props.children()}</>
  }

  const fieldProps = props

  return (
    <form.Field
      name={fieldProps.name}
      validators={fieldProps.validators as never}
      children={(field) => fieldProps.children(field as () => SimpleFieldApi<TFormData, TName>)}
    />
  )
}
