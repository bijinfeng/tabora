import { createSignal } from "solid-js"

import { Combobox } from "./combobox.styled"

export function ComboboxDemo() {
  const [value, setValue] = createSignal("")

  return (
    <Combobox
      value={value()}
      onInput={setValue}
      onSelect={(option) => setValue(option.label)}
      aria-label="搜索插件"
      placeholder="搜索插件..."
      options={[
        { value: "notes", label: "Notes" },
        { value: "todo", label: "Todo" },
        { value: "weather", label: "Weather" },
      ]}
    />
  )
}
