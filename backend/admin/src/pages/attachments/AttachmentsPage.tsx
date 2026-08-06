import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Table, type TableColumn } from "@tabora/ui/table"
import { createResource, createSignal, Show } from "solid-js"

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
  const [data, { refetch }] = createResource(() => listFiles(PAGE_SIZE, 0))

  async function handleDelete(file: AttachmentFile) {
    setError(null)
    try {
      await deleteFile(file.id)
      await refetch()
    } catch (err) {
      setError((err as Error).message)
    }
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
          <Button size="sm" variant="danger-subtle" onClick={() => void handleDelete(f)}>
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
      <Show
        when={!data.error}
        fallback={<InlineError>{(data.error as Error)?.message ?? "加载失败"}</InlineError>}
      >
        <Show
          when={data.loading || (data() && data()!.files.length > 0)}
          fallback={<EmptyState title="暂无附件" description="用户通过插件上传附件后在此巡检。" />}
        >
          <Table
            columns={columns}
            rows={data()?.files ?? []}
            rowKey={(f) => String(f.id)}
            aria-label="附件文件列表"
          />
        </Show>
      </Show>
    </div>
  )
}
