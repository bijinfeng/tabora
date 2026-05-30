import { Combobox as P } from "../../primitives/combobox/combobox"
import type { ComboboxProps, ComboboxOption } from "../../primitives/combobox/combobox"
import "./styles.css"
export function Combobox<V extends string>(props: ComboboxProps<V>) {
  return <P {...props} />
}
export type { ComboboxProps, ComboboxOption }
