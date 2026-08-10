import { createForm } from "@tanstack/solid-form"
import type { FormApi, SolidFormApi } from "@tanstack/solid-form"
import { createContext, useContext } from "solid-js"
import type { JSX } from "solid-js"

/** 不带表单级 validator 的 FormApi，附带 Solid 适配层方法（Field / useSelector / Subscribe）。 */
export type SimpleFormApi<TFormData> = FormApi<
  TFormData,
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
> &
  SolidFormApi<
    TFormData,
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

const FormContext = createContext<SimpleFormApi<any>>()

export function useFormContext<TFormData = any>() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error("useFormContext must be used within a Form component")
  }
  return context as SimpleFormApi<TFormData>
}

export type FormLayout = "vertical" | "inline"

export type FormProps<TFormData> = {
  defaultValues?: Partial<TFormData> | undefined
  onSubmit?:
    | ((values: TFormData, formApi: SimpleFormApi<TFormData>) => void | Promise<void>)
    | undefined
  layout?: FormLayout | undefined
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  children: JSX.Element | ((form: SimpleFormApi<TFormData>) => JSX.Element)
}

export function Form<TFormData extends Record<string, any>>(props: FormProps<TFormData>) {
  const form = createForm(() => ({
    defaultValues: props.defaultValues as TFormData,
    onSubmit: async ({ value }: { value: TFormData }) => {
      await props.onSubmit?.(value, form as SimpleFormApi<TFormData>)
    },
  })) as SimpleFormApi<TFormData>

  // form-core 的 handleSubmit 已负责标记 touched、跑 submit 校验并在无效时中止，这里不重复实现。
  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    event.stopPropagation()
    void form.handleSubmit()
  }

  return (
    <FormContext.Provider value={form}>
      <form onSubmit={handleSubmit} class={props.class} style={props.style} novalidate>
        {typeof props.children === "function" ? props.children(form) : props.children}
      </form>
    </FormContext.Provider>
  )
}
