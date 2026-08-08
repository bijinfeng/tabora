import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Table, type TableColumn } from "@tabora/ui/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import { Pagination } from "../../components/Pagination"
import { QueryState } from "../../components/QueryState"
import { useToast } from "../../contexts/ToastContext"
import { deleteFile, listFiles, type AttachmentFile } from "./attachmentsApi"
import { styles } from "./attachments.styles"

const PAGE_SIZE = 50

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(value: string | number): string {
  const ms = typeof value === "number" ? value * 1000 : Date.parse(value)
  return Number.isNaN(ms) ? String(value) : new Date(ms).toLocaleString()
}

export function AttachmentsPage() {
  const [error, setError] = createSignal<string | null>(null)
  const [offset, setOffset] = createSignal(0)
  const [deleteTarget, setDeleteTarget] = createSignal<AttachmentFile | null>(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const data = useQuery(() => ({
    queryKey: ["attachments", "files", offset()],
    queryFn: () => listFiles(PAGE_SIZE, offset()),
  }))

  const deleteMutation = useMutation(() => ({
    mutationFn: (id: number) => deleteFile(id),
    onMutate: () => setError(null),
    onSuccess: () => {
      setDeleteTarget(null)
      showToast({ variant: "success", title: "附件已删除" })
      return queryClient.invalidateQueries({ queryKey: ["attachments", "files"] })
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
      cell: (f) => <span {...stylex.attrs(styles.mono)}>{f.mime}</span>,
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
      cell: (f) => <span {...stylex.attrs(styles.muted)}>{formatTime(f.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      cell: (f) => (
        <div {...stylex.attrs(styles.actionCell)}>
          <Button size="sm" variant="danger-subtle" onClick={() => setDeleteTarget(f)}>
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div {...stylex.attrs(styles.page)}>
      <Show when={error()}>
        <InlineError>{error()}</InlineError>
      </Show>
      <QueryState
        error={data.error as Error | null}
        loading={data.isPending}
        hasRows={(data.data?.files.length ?? 0) > 0}
        empty={<EmptyState title="暂无附件" description="用户通过插件上传附件后在此巡检。" />}
      >
        <Table
          columns={columns}
          rows={data.data?.files ?? []}
          rowKey={(f) => String(f.id)}
          aria-label="附件文件列表"
        />
      </QueryState>

      <Show when={data.data}>
        {(d) => (
          <Pagination
            offset={offset()}
            pageSize={PAGE_SIZE}
            total={d().total}
            onPrev={() => setOffset(Math.max(0, offset() - PAGE_SIZE))}
            onNext={() => setOffset(offset() + PAGE_SIZE)}
          />
        )}
      </Show>

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
