import { createSignal } from "solid-js"

import { Button, IconButton } from "./button.styled"
import { Ellipsis, Plus, Trash2 } from "lucide-solid"

export function ButtonDemo() {
  const [count, setCount] = createSignal(0)
  const [lastVariant, setLastVariant] = createSignal("")

  return (
    <div class="docs-control-stack">
      <div class="docs-row">
        <Button
          variant="primary"
          onClick={() => {
            setCount((value) => value + 1)
            setLastVariant("primary")
          }}
        >
          主要
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setCount((value) => value + 1)
            setLastVariant("secondary")
          }}
        >
          次要
        </Button>
        <Button
          variant="subtle"
          onClick={() => {
            setCount((value) => value + 1)
            setLastVariant("subtle")
          }}
        >
          柔和
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setCount((value) => value + 1)
            setLastVariant("ghost")
          }}
        >
          隐形
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            setCount((value) => value + 1)
            setLastVariant("danger")
          }}
        >
          危险
        </Button>
        <Button
          variant="danger-subtle"
          onClick={() => {
            setCount((value) => value + 1)
            setLastVariant("danger-subtle")
          }}
        >
          危险柔和
        </Button>
      </div>
      <div class="docs-row compact">
        <span>
          点击次数：{count()}（最近：{lastVariant() || "—"}）
        </span>
      </div>
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
