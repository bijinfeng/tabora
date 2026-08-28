import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Table, type TableColumn } from "@tabora/ui/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"
import Plus from "lucide-solid/icons/plus"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import { useToast } from "../../contexts/ToastContext"
import { shared } from "../shared.styles"
import { PolicyEditorDialog } from "./PolicyEditorDialog"
import { deletePolicy, listPolicies, type AttachmentPolicy } from "../../server/admin/attachments"
import { styles } from "./attachments.styles"

function formatSize(bytes: number | null): string {
  if (bytes === null) return "不限"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AttachmentPoliciesPage() {
  const [editorOpen, setEditorOpen] = createSignal(false)
  const [editing, setEditing] = createSignal<AttachmentPolicy | null>(null)
  const [deleteTarget, setDeleteTarget] = createSignal<AttachmentPolicy | null>(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const data = useQuery(() => ({
    queryKey: ["attachment-policies"],
    queryFn: () => listPolicies(),
  }))

  const deleteMutation = useMutation(() => ({
    mutationFn: (entityType: string) => deletePolicy({ data: { entityType } }),
    onSuccess: () => {
      setDeleteTarget(null)
      showToast({ variant: "success", title: "策略已删除" })
      return queryClient.invalidateQueries({ queryKey: ["attachment-policies"] })
    },
    onError: (err: Error) => {
      showToast({ variant: "danger", title: "删除失败", description: err.message })
    },
  }))

  function openNew() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(policy: AttachmentPolicy) {
    setEditing(policy)
    setEditorOpen(true)
  }

  function confirmDelete() {
    const policy = deleteTarget()
    if (!policy || deleteMutation.isPending) return
    deleteMutation.mutate(policy.entityType)
  }

  const columns: TableColumn<AttachmentPolicy>[] = [
    {
      key: "entity",
      header: "entity_type",
      cell: (p) => <span {...stylex.attrs(shared.mono)}>{p.entityType}</span>,
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
        <div {...stylex.attrs(shared.actionCell)}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
            编辑
          </Button>
          <Button size="sm" variant="danger-subtle" onClick={() => setDeleteTarget(p)}>
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div {...stylex.attrs(shared.page)}>
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
              compact
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

      <ConfirmDialog
        open={deleteTarget() !== null}
        title="删除附件策略"
        description={`确认删除 entity_type「${deleteTarget()?.entityType ?? ""}」的策略？删除后该类实体上传将不再受此策略限制。`}
        confirmLabel="删除"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
