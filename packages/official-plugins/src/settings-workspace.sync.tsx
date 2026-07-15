import { Badge, Button, FieldRow, Switch } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

type SyncPhase = "off" | "pending" | "syncing" | "synced"

export function SyncSettingsPanel(_props: SettingsPanelViewProps) {
  const [phase, setPhase] = createSignal<SyncPhase>("off")
  const [autoSync, setAutoSync] = createSignal(false)
  const [lastSyncTime, setLastSyncTime] = createSignal("未同步")

  const overallStatus = () => {
    if (phase() === "syncing") return "同步中"
    if (phase() === "synced") return "已同步"
    if (phase() === "pending") return "待开启"
    return "未开启"
  }
  const modeLabel = () => {
    if (phase() === "syncing") return "同步中"
    if (phase() === "synced") return "官方云同步"
    if (phase() === "pending") return "待开启"
    return "本地模式"
  }
  const queueStatus = () => {
    if (phase() === "syncing") return "上传中"
    if (phase() === "synced") return "队列清空"
    if (phase() === "pending") return "等待开启"
    return "未开启"
  }
  const signedOut = () => phase() === "off"

  function handleSyncNow() {
    if (signedOut() || phase() === "syncing") return
    setPhase("syncing")
    window.setTimeout(() => {
      setPhase("synced")
      setLastSyncTime("刚刚")
    }, 620)
  }

  function handleAutoSyncChange(enabled: boolean) {
    setAutoSync(enabled)
    if (enabled && phase() === "off") setPhase("pending")
  }

  return (
    <div class="settings-panel-stack">
      <section class="set-group">
        <div class="set-group-title">
          同步状态<span>{overallStatus()}</span>
        </div>
        <FieldRow
          class="settings-form-row"
          label={modeLabel()}
          description={lastSyncTime()}
          trailing={
            <Badge variant={phase() === "off" ? "neutral" : "accent"}>{queueStatus()}</Badge>
          }
        />
        <FieldRow
          class="settings-form-row"
          label="后台自动同步"
          trailing={
            <Switch
              size="sm"
              checked={autoSync()}
              onChange={handleAutoSyncChange}
              aria-label="后台自动同步"
            />
          }
        />
        <FieldRow
          class="settings-form-row"
          label="立即同步"
          trailing={
            <Button
              size="sm"
              variant="primary"
              disabled={signedOut() || phase() === "syncing"}
              onClick={handleSyncNow}
            >
              {signedOut() ? "登录后可用" : phase() === "syncing" ? "同步中" : "立即同步"}
            </Button>
          }
        />
      </section>

      <section class="set-group">
        <div class="set-group-title">
          同步范围<span>V1</span>
        </div>
        <FieldRow
          class="settings-form-row"
          label="会同步"
          description="工作区 / 插件配置 / 可同步数据"
        />
        <FieldRow class="settings-form-row" label="不会同步" description="密钥 / 本机路径 / 缓存" />
      </section>

      <section class="set-group">
        <div class="set-group-title">
          处理<span>0 条冲突</span>
        </div>
        <FieldRow
          class="settings-form-row"
          label="冲突"
          trailing={
            <Button size="sm" variant="secondary">
              查看冲突
            </Button>
          }
        />
        <FieldRow
          class="settings-form-row"
          label="恢复"
          trailing={
            <Button size="sm" variant="secondary">
              查看快照
            </Button>
          }
        />
      </section>
    </div>
  )
}
