import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import type { TableColumn } from "@tabora/ui/table"
import { useMutation } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import {
  AdminDataTablePanel,
  type AdminDataTableActions,
} from "../../components/AdminDataTablePanel"
import { useToast } from "../../contexts/ToastContext"
import { formatAdminTimestamp } from "../../utils/formatTimestamp"
import { shared } from "../shared.styles"
import { deleteFile, listFiles, type AttachmentFile } from "../../server/admin/attachments"
import { styles } from "./attachments.styles"

const PAGE_SIZE = 50

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AttachmentsPage() {
  const [error, setError] = createSignal<string | null>(null)
  const [deleteTarget, setDeleteTarget] = createSignal<AttachmentFile | null>(null)
  const { showToast } = useToast()
  let tableActions: AdminDataTableActions | undefined

  const deleteMutation = useMutation(() => ({
    mutationFn: (id: number) => deleteFile({ data: { id } }),
    onMutate: () => setError(null),
    onSuccess: () => {
      setDeleteTarget(null)
      showToast({ variant: "success", title: "附件已删除" })
      tableActions?.reload()
    },
    onError: (err: Error) => {
      setError(err.message)
      showToast({ variant: "danger", title: "删除失败", description: err.message })
    },
  }))

  function confirmDelete() {
    const file = deleteTarget()
    if (!file || deleteMutation.isPending) return
    deleteMutation.mutate(file.id)
  }

  const columns: TableColumn<AttachmentFile>[] = [
    { key: "filename", header: "文件名", cell: (f) => <span>{f.filename}</span> },
    {
      key: "mime",
      header: "类型",
      cell: (f) => <span {...stylex.attrs(shared.mono)}>{f.mime}</span>,
    },
    {
      key: "size",
      header: "大小",
      cell: (f) => <span {...stylex.attrs(styles.muted)}>{formatSize(f.sizeBytes)}</span>,
    },
    {
      key: "refs",
      header: "引用",
      cell: (f) => (
        <Badge variant={f.refsCount === 0 ? "warning" : "neutral"} size="sm">
          {f.refsCount === 0 ? "孤儿" : `${f.refsCount} 处`}
        </Badge>
      ),
    },
    {
      key: "created",
      header: "上传时间",
      cell: (f) => (
        <span {...stylex.attrs(styles.muted)}>{formatAdminTimestamp(String(f.createdAt))}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (f) => (
        <div {...stylex.attrs(shared.actionCell)}>
          <Button size="sm" variant="danger-subtle" onClick={() => setDeleteTarget(f)}>
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div {...stylex.attrs(shared.page)}>
      <Show when={error()}>
        <InlineError>{error()}</InlineError>
      </Show>
      <AdminDataTablePanel
        queryKey={["attachments", "files"]}
        request={async ({ current, pageSize }) => {
          const result = await listFiles({
            data: { limit: pageSize, offset: (current - 1) * pageSize },
          })
          return { data: result.files, total: result.total }
        }}
        pageSize={PAGE_SIZE}
        columns={columns}
        rowKey={(f) => String(f.id)}
        errorMessage="加载附件失败"
        empty={
          <EmptyState compact title="暂无附件" description="用户通过插件上传附件后在此巡检。" />
        }
        actionRef={(actions) => (tableActions = actions)}
        ariaLabel="附件文件列表"
      />

      <ConfirmDialog
        open={deleteTarget() !== null}
        title="删除附件"
        description={`确认删除「${deleteTarget()?.filename ?? ""}」？该操作不可撤销，文件将从存储中永久移除。`}
        confirmLabel="删除"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
