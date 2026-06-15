import { ContextMenu } from "./contextMenu.styled"

export function ContextMenuDemo() {
  return (
    <ContextMenu
      aria-label="卡片菜单"
      onSelect={() => {}}
      items={[
        { key: "size", label: "调整尺寸", shortcut: "S" },
        { key: "open", label: "展开视图" },
        { key: "remove", label: "移除卡片", danger: true },
      ]}
      triggerClass="tbr-context-menu"
    >
      <div class="tbr-context-menu-content">右键打开菜单</div>
    </ContextMenu>
  )
}
