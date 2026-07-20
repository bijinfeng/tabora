import { Button, IconButton } from "./button.styled"
import { Plus, Ellipsis } from "lucide-solid"
import * as stylex from "@stylexjs/stylex"

import { demoStyles } from "../demoStyles"

const buttonDemoStyles = stylex.create({
  groupedButton: {
    borderRadius: 0,
    boxShadow: "none",
    marginLeft: -1,
    outline: "none",
    position: "relative",
    ":hover": {
      zIndex: 1,
    },
    ":focus-visible": {
      zIndex: 1,
    },
  },
  groupedFirst: {
    borderBottomLeftRadius: "var(--tbr-radius-control, 6px)",
    borderTopLeftRadius: "var(--tbr-radius-control, 6px)",
    marginLeft: 0,
  },
  groupedLast: {
    borderBottomRightRadius: "var(--tbr-radius-control, 6px)",
    borderTopRightRadius: "var(--tbr-radius-control, 6px)",
  },
  groupedActive: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-accent))",
    zIndex: 2,
  },
  hoverDemo: {
    backgroundColor: "rgb(var(--tbr-color-accent-hover))",
    borderColor: "rgb(var(--tbr-color-accent-hover))",
  },
  activeDemo: {
    transform: "translateY(1px)",
  },
  focusDemo: {
    boxShadow: "0 0 0 4px rgb(var(--tbr-color-focus) / 0.18)",
    outline: "2px solid rgb(var(--tbr-color-focus))",
    outlineOffset: 2,
  },
})

export function ButtonDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.section)}>
        <h4 {...stylex.attrs(demoStyles.sectionTitle)}>变体</h4>
        <div {...stylex.attrs(demoStyles.row)}>
          <Button variant="primary">主要</Button>
          <Button variant="secondary">次要</Button>
          <Button variant="subtle">柔和</Button>
          <Button variant="ghost">隐形</Button>
          <Button variant="danger">危险</Button>
          <Button variant="danger-subtle">危险柔和</Button>
        </div>
      </div>

      <div {...stylex.attrs(demoStyles.section)}>
        <h4 {...stylex.attrs(demoStyles.sectionTitle)}>尺寸 + 全宽 + 纯图标</h4>
        <div {...stylex.attrs(demoStyles.row)}>
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

      <div {...stylex.attrs(demoStyles.section)}>
        <h4 {...stylex.attrs(demoStyles.sectionTitle)}>按钮组</h4>
        <div {...stylex.attrs(demoStyles.row)}>
          <div {...stylex.attrs(demoStyles.buttonGroup)}>
            <Button
              variant="secondary"
              xstyle={[buttonDemoStyles.groupedButton, buttonDemoStyles.groupedFirst]}
            >
              日
            </Button>
            <Button variant="secondary" xstyle={buttonDemoStyles.groupedButton}>
              周
            </Button>
            <Button
              variant="secondary"
              xstyle={[
                buttonDemoStyles.groupedButton,
                buttonDemoStyles.groupedLast,
                buttonDemoStyles.groupedActive,
              ]}
            >
              月
            </Button>
          </div>
        </div>
      </div>

      <div {...stylex.attrs(demoStyles.section)}>
        <h4 {...stylex.attrs(demoStyles.sectionTitle)}>状态</h4>
        <div {...stylex.attrs(demoStyles.row)}>
          <Button variant="primary">默认</Button>
          <Button variant="primary" xstyle={buttonDemoStyles.hoverDemo}>
            悬停
          </Button>
          <Button variant="primary" xstyle={buttonDemoStyles.activeDemo}>
            按下
          </Button>
          <Button variant="primary" xstyle={buttonDemoStyles.focusDemo}>
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
    <div {...stylex.attrs(demoStyles.row)}>
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
