import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Table, type TableColumn } from "@tabora/ui/table"
import { useQuery, useQueryClient } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"
import Plus from "lucide-solid/icons/plus"

import { PolicyEditorDialog } from "./PolicyEditorDialog"
import { listPolicies, type AttachmentPolicy } from "./attachmentsApi"
import { styles } from "./attachments.styles"

function formatSize(bytes: number | null): string {
  if (bytes === null) return "不限"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AttachmentPoliciesPage() {
  const [editorOpen, setEditorOpen] = createSignal(false)
  const [editing, setEditing] = createSignal<AttachmentPolicy | null>(null)
  const queryClient = useQueryClient()
  const data = useQuery(() => ({
    queryKey: ["attachment-policies"],
    queryFn: listPolicies,
  }))

  function openNew() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(policy: AttachmentPolicy) {
    setEditing(policy)
    setEditorOpen(true)
  }

  const columns: TableColumn<AttachmentPolicy>[] = [
    {
      key: "entity",
      header: "entity_type",
      cell: (p) => <span {...stylex.attrs(styles.mono)}>{p.entityType}</span>,
    },
    {
      key: "mime",
      header: "MIME 白名单",
      cell: (p) =>
        p.mimeWhitelist && p.mimeWhitelist.length > 0 ? (
          <span {...stylex.attrs(styles.muted)}>{p.mimeWhitelist.join(", ")}</span>
        ) : (
          <Badge variant="neutral" size="sm">
            不限
          </Badge>
        ),
    },
    {
      key: "size",
      header: "最大大小",
      cell: (p) => <span {...stylex.attrs(styles.muted)}>{formatSize(p.maxSizeBytes)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (p) => (
        <div {...stylex.attrs(styles.actionCell)}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
            编辑
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div {...stylex.attrs(styles.page)}>
      <div {...stylex.attrs(styles.toolbar)}>
        <span {...stylex.attrs(styles.muted)}>按 entity_type 限制上传 MIME 与大小</span>
        <Button variant="primary" onClick={openNew}>
          <Plus size={16} />
          新建策略
        </Button>
      </div>

      <Show
        when={!data.error}
        fallback={<InlineError>{(data.error as Error)?.message ?? "加载失败"}</InlineError>}
      >
        <Show
          when={data.isPending || (data.data && data.data.length > 0)}
          fallback={
            <EmptyState
              title="暂无附件策略"
              description="新建策略以限制某类实体的上传类型与大小。"
            />
          }
        >
          <Table
            columns={columns}
            rows={data.data ?? []}
            rowKey={(p) => String(p.id)}
            aria-label="附件策略列表"
          />
        </Show>
      </Show>

      <PolicyEditorDialog
        open={editorOpen()}
        editing={editing()}
        onClose={() => setEditorOpen(false)}
        onSaved={() => void queryClient.invalidateQueries({ queryKey: ["attachment-policies"] })}
      />
    </div>
  )
}
