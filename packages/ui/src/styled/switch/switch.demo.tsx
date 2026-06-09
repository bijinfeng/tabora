import { createSignal } from "solid-js"

import { Switch } from "./switch.styled"

export function SwitchDemo() {
  const [enabled, setEnabled] = createSignal(true)

  return <Switch checked={enabled()} onChange={setEnabled} label="启用插件" />
}
