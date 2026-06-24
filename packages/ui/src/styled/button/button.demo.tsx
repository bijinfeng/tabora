import { Button, IconButton } from "./button.styled"
import { Plus, Ellipsis } from "lucide-solid"
import "./button.demo.css"

export function ButtonDemo() {
  return (
    <div class="docs-control-stack">
      <div class="demo-section">
        <h4>变体</h4>
        <div class="demo-row">
          <Button variant="primary">主要</Button>
          <Button variant="secondary">次要</Button>
          <Button variant="subtle">柔和</Button>
          <Button variant="ghost">隐形</Button>
          <Button variant="danger">危险</Button>
          <Button variant="danger-subtle">危险柔和</Button>
        </div>
      </div>

      <div class="demo-section">
        <h4>尺寸 + 全宽 + 纯图标</h4>
        <div class="demo-row">
          <Button variant="primary" size="sm">
            小 28px
          </Button>
          <Button variant="primary" size="md">
            中 36px
          </Button>
          <Button variant="primary" size="lg">
            大 44px
          </Button>
          <div style={{ width: "180px" }}>
            <Button variant="primary" fullWidth>
              全宽按钮
            </Button>
          </div>
          <IconButton aria-label="添加" variant="secondary">
            <Plus size={16} strokeWidth={2} />
          </IconButton>
          <IconButton aria-label="更多" variant="secondary" size="sm">
            <Ellipsis size={14} strokeWidth={2} />
          </IconButton>
        </div>
      </div>

      <div class="demo-section">
        <h4>按钮组</h4>
        <div class="demo-row">
          <div class="btn-group">
            <Button variant="secondary">日</Button>
            <Button variant="secondary">周</Button>
            <Button variant="secondary" class="btn-group-active">
              月
            </Button>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h4>状态</h4>
        <div class="demo-row">
          <Button variant="primary">默认</Button>
          <Button variant="primary" class="btn-hover-demo">
            悬停
          </Button>
          <Button variant="primary" class="btn-active-demo">
            按下
          </Button>
          <Button variant="primary" class="btn-focus-demo">
            聚焦
          </Button>
          <Button variant="primary" disabled>
            禁用
          </Button>
          <Button variant="primary" loading>
            加载中
          </Button>
        </div>
      </div>
    </div>
  )
}

export function IconButtonDemo() {
  return (
    <div class="docs-row">
      <IconButton aria-label="添加" size="sm">
        <Plus size={14} strokeWidth={2} />
      </IconButton>
      <IconButton aria-label="添加">
        <Plus size={16} strokeWidth={2} />
      </IconButton>
      <IconButton aria-label="更多" variant="secondary">
        <Ellipsis size={16} strokeWidth={2} />
      </IconButton>
    </div>
  )
}
