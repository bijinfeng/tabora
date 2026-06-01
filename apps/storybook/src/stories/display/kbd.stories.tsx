import { Kbd } from "@tabora/ui"

export default {
  title: "Display/Kbd",
  component: Kbd,
}

export const Single = {
  render: () => <Kbd>Ctrl</Kbd>,
}

export const Combo = {
  render: () => (
    <span style={{ "font-size": "14px" }}>
      <Kbd>Cmd</Kbd> + <Kbd>K</Kbd>
    </span>
  ),
}

export const ThreeKeys = {
  render: () => (
    <span style={{ "font-size": "14px" }}>
      <Kbd>Shift</Kbd> + <Kbd>Cmd</Kbd> + <Kbd>P</Kbd>
    </span>
  ),
}

export const InContext = {
  render: () => (
    <p style={{ "font-size": "14px", color: "var(--tabora-fg-primary)" }}>
      按 <Kbd>Cmd</Kbd> + <Kbd>S</Kbd> 保存文件。
    </p>
  ),
}
