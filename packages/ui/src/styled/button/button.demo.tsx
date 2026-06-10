import { Button, IconButton } from "./button.styled"
import { Ellipsis, Plus, Trash2 } from "lucide-solid"

export function ButtonDemo() {
  return (
    <div class="docs-row">
      <Button variant="primary">主要</Button>
      <Button variant="secondary">次要</Button>
      <Button variant="subtle">柔和</Button>
      <Button variant="ghost">隐形</Button>
      <Button variant="danger">危险</Button>
      <Button variant="danger-subtle">危险柔和</Button>
    </div>
  )
}

export function IconButtonDemo() {
  return (
    <div class="docs-row">
      <IconButton aria-label="添加">
        <Plus size={16} strokeWidth={2} />
      </IconButton>
      <IconButton aria-label="更多" variant="secondary">
        <Ellipsis size={16} strokeWidth={2} />
      </IconButton>
      <IconButton aria-label="删除" variant="danger">
        <Trash2 size={16} strokeWidth={2} />
      </IconButton>
    </div>
  )
}
