import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { Checkbox } from "../checkbox"
import { Button } from "../button"
import { demoStyles } from "../demoStyles"
import { Dialog } from "./dialog.styled"

export function DialogDemo() {
  const [open, setOpen] = createSignal(false)
  const [cleanupData, setCleanupData] = createSignal(true)
  const [submitting, setSubmitting] = createSignal(false)
  const [lastAction, setLastAction] = createSignal("尚未执行危险操作。")

  const closeDialog = () => {
    if (submitting()) return
    setOpen(false)
  }

  const confirmRemoval = () => {
    setSubmitting(true)
    window.setTimeout(() => {
      setSubmitting(false)
      setOpen(false)
      setLastAction(
        cleanupData() ? "插件已移除，并清理了本地缓存数据。" : "插件已移除，保留了本地配置快照。",
      )
    }, 600)
  }

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>移除插件</strong>
        <span>演示危险确认、附加选项和提交中状态。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          打开 Dialog
        </Button>
        <span>{lastAction()}</span>
      </div>
      <Dialog
        open={open()}
        onCancel={closeDialog}
        title="移除插件"
        description="该操作会从当前工作区中卸载插件实例，但不会影响其他工作区。"
        destructive
        onOk={confirmRemoval}
        okText="确认移除"
        confirmLoading={submitting()}
      >
        <div {...stylex.attrs(demoStyles.stackCompact)}>
          <Checkbox
            checked={cleanupData()}
            onChange={setCleanupData}
            aria-label="同时清理本地数据"
            label="同时清理本地数据"
          />
          <span>建议在排查异常状态时保留本地数据，方便稍后恢复配置。</span>
        </div>
      </Dialog>
    </div>
  )
}
