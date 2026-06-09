import { createSignal } from "solid-js"

import { Menubar } from "./menubar.styled"

export function MenubarDemo() {
  const [value, setValue] = createSignal("general")

  return (
    <Menubar
      aria-label="设置导航"
      value={value()}
      onChange={setValue}
      items={[
        { value: "general", label: "通用" },
        { value: "appearance", label: "外观" },
        { value: "plugins", label: "插件" },
      ]}
    />
  )
}
