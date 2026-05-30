import { RadioGroup as P } from "../../primitives/radioGroup/radioGroup"
import type { RadioGroupProps, RadioGroupOption } from "../../primitives/radioGroup/radioGroup"
import "./styles.css"
export function RadioGroup<V extends string>(props: RadioGroupProps<V>) {
  return <P {...props} class="tbr-radio-group" />
}
export type { RadioGroupProps, RadioGroupOption }
