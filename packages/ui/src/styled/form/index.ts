import { Form as FormComponent } from "./form.styled"
import type { FormProps } from "./form.styled"
import { FormItem } from "./form-item.styled"
import type { FormItemProps } from "./form-item.styled"

export const Form = Object.assign(FormComponent, {
  Item: FormItem,
})

export type { FormItemProps, FormProps }
export { useFormContext } from "../../primitives/form"
export type { FormLayout, SimpleFieldApi, SimpleFormApi } from "../../primitives/form"
