import { createSignal } from "solid-js"

import { demoStyles, sx } from "../demoStyles"
import { Button } from "../button"
import { Checkbox } from "../checkbox"
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
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>移除插件</strong>
        <span>演示危险确认、附加选项和提交中状态。</span>
      </div>
      <div {...sx(demoStyles.row)}>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          打开 Dialog
        </Button>
        <span>{lastAction()}</span>
      </div>
      <Dialog
        open={open()}
        onClose={closeDialog}
        title="移除插件"
        description="该操作会从当前工作区中卸载插件实例，但不会影响其他工作区。"
        destructive
        children={
          <div {...sx(demoStyles.stackCompact)}>
            <Checkbox
              checked={cleanupData()}
              onChange={setCleanupData}
              aria-label="同时清理本地数据"
              label="同时清理本地数据"
            />
            <span>建议在排查异常状态时保留本地数据，方便稍后恢复配置。</span>
          </div>
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeDialog} disabled={submitting()}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmRemoval} disabled={submitting()}>
              {submitting() ? "移除中..." : "确认移除"}
            </Button>
          </>
        }
      />
    </div>
  )
}
