import { createSignal } from "solid-js"

import { Combobox } from "./combobox.styled"

export function ComboboxDemo() {
  const [value, setValue] = createSignal("")

  return (
    <Combobox
      value={value()}
      onInput={setValue}
      onSelect={(nextValue) => setValue(nextValue)}
      placeholder="搜索插件..."
      options={[
        { value: "notes", label: "Notes" },
        { value: "todo", label: "Todo" },
        { value: "weather", label: "Weather" },
      ]}
    />
  )
}
