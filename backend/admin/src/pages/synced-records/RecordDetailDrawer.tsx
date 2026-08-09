import * as stylex from "@stylexjs/stylex"
import { Drawer } from "@tabora/ui"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { For, Show } from "solid-js"

import { styles } from "./syncedRecords.styles"
import { formatAdminTimestamp } from "../../utils/formatTimestamp"
import type { SyncedRecord } from "./syncedRecordsApi"

const SENSITIVE_KEY = /token|secret|password|apikey|api_key|privatekey|credential/i

/** 递归脱敏疑似敏感字段的值，仅保留字段名。 */
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        SENSITIVE_KEY.test(k) ? [k, "[已脱敏]"] : [k, redact(v)],
      ),
    )
  }
  return value
}

type Props = {
  record: SyncedRecord | null
  onClose: () => void
  onDelete: (record: SyncedRecord) => void
}

export function RecordDetailDrawer(props: Props) {
  const meta = () => {
    const r = props.record
    if (!r) return []
    return [
      ["类型", r.recordType],
      ["记录 ID", r.recordId],
      ["Owner", r.ownerEmail ?? r.ownerId],
      ["版本", String(r.version)],
      ["设备", r.deviceId],
      ["更新时间", formatAdminTimestamp(r.recordUpdatedAt)],
    ] as const
  }

  return (
    <Drawer
      open={props.record !== null}
      onClose={props.onClose}
      title="同步记录详情"
      description="payload 只读，疑似敏感字段已脱敏。"
    >
      <Show when={props.record}>
        {(r) => (
          <div {...stylex.attrs(styles.drawerBody)}>
            <Show when={r().deleted}>
              <Badge variant="danger" size="sm">
                已删除 (tombstone)
              </Badge>
            </Show>
            <div {...stylex.attrs(styles.metaGrid)}>
              <For each={meta()}>
                {([label, value]) => (
                  <>
                    <span {...stylex.attrs(styles.metaLabel)}>{label}</span>
                    <span {...stylex.attrs(styles.metaValue)}>{value}</span>
                  </>
                )}
              </For>
            </div>
            <pre {...stylex.attrs(styles.jsonBlock)}>
              {JSON.stringify(redact(r().data), null, 2)}
            </pre>
            <div {...stylex.attrs(styles.drawerFooter)}>
              <Button variant="danger" onClick={() => props.onDelete(r())}>
                强制删除记录
              </Button>
            </div>
          </div>
        )}
      </Show>
    </Drawer>
  )
}
