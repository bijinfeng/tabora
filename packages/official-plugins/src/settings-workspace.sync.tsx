import { Badge, Button, FieldRow, Switch } from "@tabora/ui"
import { createSignal, onMount } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { className, styles, sx } from "./styles"

function formatSyncTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())}`
}

function messageFor(error: unknown): string {
  const code = (error as { code?: string })?.code
  const message = (error as { message?: string })?.message
  return message ?? (code ? String(code) : "同步失败，请稍后重试")
}

export function SyncSettingsPanel(props: SettingsPanelViewProps) {
  const sync = () => props.host.sync
  const [lastSyncAt, setLastSyncAt] = createSignal<string | null>(null)
  const [autoSync, setAutoSync] = createSignal(false)
  const [busy, setBusy] = createSignal(false)
  const [status, setStatus] = createSignal("")

  onMount(async () => {
    const client = sync()
    if (!client) return
    try {
      setLastSyncAt(await client.getLastSyncAt())
    } catch {
      // 读取失败按未同步处理
    }
  })

  const overallStatus = () => {
    if (!sync()) return "未开启"
    if (busy()) return "同步中"
    if (lastSyncAt()) return "已同步"
    return "待同步"
  }
  const modeLabel = () => (sync() ? "官方云同步" : "本地模式")
  const queueStatus = () => {
    if (!sync()) return "未接入"
    if (busy()) return "同步中"
    if (lastSyncAt()) return "已同步"
    return "待同步"
  }
  const lastSyncLabel = () => {
    if (!sync()) return "未配置同步服务"
    const at = lastSyncAt()
    return at ? formatSyncTime(at) : "尚未同步"
  }

  function handleSyncNow() {
    const client = sync()
    if (!client || busy()) return
    setBusy(true)
    setStatus("")
    void (async () => {
      try {
        await client.triggerSync()
        setLastSyncAt(await client.getLastSyncAt())
        setStatus("已同步")
      } catch (error) {
        setStatus(messageFor(error))
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <div {...sx(styles.panelStack)} data-settings-panel="sync">
      <section {...sx(styles.group)}>
        <div {...sx(styles.groupTitle)}>
          同步状态<span>{overallStatus()}</span>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label={modeLabel()}
          description={lastSyncLabel()}
          trailing={<Badge variant={sync() ? "accent" : "neutral"}>{queueStatus()}</Badge>}
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="后台自动同步"
          trailing={
            <Switch
              size="sm"
              checked={autoSync()}
              onChange={setAutoSync}
              aria-label="后台自动同步"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="立即同步"
          trailing={
            <Button
              size="sm"
              variant="primary"
              disabled={!sync() || busy()}
              onClick={handleSyncNow}
            >
              {!sync() ? "未配置" : busy() ? "同步中" : "立即同步"}
            </Button>
          }
        />
        <span {...sx(styles.authStatus)}>{status()}</span>
      </section>
    </div>
  )
}
