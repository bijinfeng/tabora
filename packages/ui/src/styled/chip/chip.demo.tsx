import { Chip } from "./chip.styled"

export function ChipDemo() {
  return (
    <div class="docs-row">
      <Chip selected>选中</Chip>
      <Chip removable onRemove={() => {}}>
        可移除
      </Chip>
    </div>
  )
}
