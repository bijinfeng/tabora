import { Button, Tooltip } from "@tabora/ui"

export default {
  title: "Overlays/Tooltip",
  component: Tooltip,
}

export const Top = {
  render: () => (
    <Tooltip content="提示信息文本" placement="top">
      <Button variant="secondary" size="sm">
        悬停查看上方提示
      </Button>
    </Tooltip>
  ),
}

export const Bottom = {
  render: () => (
    <Tooltip content="提示信息文本" placement="bottom">
      <Button variant="secondary" size="sm">
        悬停查看下方提示
      </Button>
    </Tooltip>
  ),
}

export const Left = {
  render: () => (
    <Tooltip content="提示信息文本" placement="left">
      <Button variant="secondary" size="sm">
        悬停查看左侧提示
      </Button>
    </Tooltip>
  ),
}

export const Right = {
  render: () => (
    <Tooltip content="提示信息文本" placement="right">
      <Button variant="secondary" size="sm">
        悬停查看右侧提示
      </Button>
    </Tooltip>
  ),
}

export const LongContent = {
  render: () => (
    <Tooltip
      content="这是一段很长的提示文本，用于展示 Tooltip 在内容较多时的显示效果。"
      placement="top"
    >
      <Button variant="secondary" size="sm">
        长文本提示
      </Button>
    </Tooltip>
  ),
}
