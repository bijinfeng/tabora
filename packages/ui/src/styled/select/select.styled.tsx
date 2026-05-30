import { Select as Primitive } from "../../primitives/select/select"
import type { SelectProps, SelectOption } from "../../primitives/select/select"
import "./styles.css"

export function Select<V extends string>(props: SelectProps<V>) {
  return <Primitive {...props} />
}

export type { SelectProps, SelectOption }
