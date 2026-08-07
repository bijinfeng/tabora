import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { Button } from "@tabora/ui/button"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import { Table, type TableColumn } from "@tabora/ui/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"
import Search from "lucide-solid/icons/search"

import { RecordDetailDrawer } from "./RecordDetailDrawer"
import { styles } from "./syncedRecords.styles"
import { deleteSyncedRecord, listSyncedRecords, type SyncedRecord } from "./syncedRecordsApi"

const PAGE_SIZE = 50

const TYPE_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "workspace", label: "workspace" },
  { value: "pluginInstance", label: "pluginInstance" },
  { value: "plugin", label: "plugin" },
  { value: "pluginData", label: "pluginData" },
]

const DELETED_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "false", label: "有效" },
  { value: "true", label: "已删除" },
]

export function SyncedRecordsPage() {
  const [type, setType] = createSignal("")
  const [deleted, setDeleted] = createSignal("")
  const [search, setSearch] = createSignal("")
  const [offset, setOffset] = createSignal(0)
  const [detail, setDetail] = createSignal<SyncedRecord | null>(null)
  const queryClient = useQueryClient()

  const data = useQuery(() => ({
    queryKey: [
      "synced-records",
      { type: type(), deleted: deleted(), search: search(), offset: offset() },
    ],
    queryFn: () =>
      listSyncedRecords({
        limit: PAGE_SIZE,
        offset: offset(),
        ...(type() ? { type: type() } : {}),
        ...(deleted() ? { deleted: deleted() === "true" } : {}),
        ...(search() ? { search: search() } : {}),
      }),
  }))

  const deleteMutation = useMutation(() => ({
    mutationFn: (id: string) => deleteSyncedRecord(id),
    onSuccess: () => {
      setDetail(null)
      void queryClient.invalidateQueries({ queryKey: ["synced-records"] })
    },
  }))

  function handleDelete(record: SyncedRecord) {
    deleteMutation.mutate(record.id)
  }

  const columns = buildColumns()

  return (
    <div {...stylex.attrs(styles.page)}>
      <div {...stylex.attrs(styles.toolbar)}>
        <div {...stylex.attrs(styles.searchBox)}>
          <Input
            value={search()}
            onInput={(v) => {
              setSearch(v)
              setOffset(0)
            }}
            placeholder="按记录 ID 搜索"
            leadingIcon={<Search size={16} />}
            clearable
            aria-label="搜索同步记录"
          />
        </div>
        <Select
          value={type()}
          onChange={(v) => {
            setType(v)
            setOffset(0)
          }}
          options={TYPE_OPTIONS}
          aria-label="按类型筛选"
        />
        <Select
          value={deleted()}
          onChange={(v) => {
            setDeleted(v)
            setOffset(0)
          }}
          options={DELETED_OPTIONS}
          aria-label="按状态筛选"
        />
      </div>

      <Show
        when={!data.error}
        fallback={<InlineError>{(data.error as Error)?.message ?? "加载失败"}</InlineError>}
      >
        <Show
          when={data.isPending || (data.data && data.data.records.length > 0)}
          fallback={
            <EmptyState title="暂无同步记录" description="调整筛选条件，或等待客户端上传数据。" />
          }
        >
          <Table
            columns={columns}
            rows={data.data?.records ?? []}
            rowKey={(r) => r.id}
            onRowClick={(r) => setDetail(r)}
            aria-label="同步记录列表"
          />
        </Show>
      </Show>

      <Show when={data.data}>
        {(d) => (
          <Pagination
            offset={offset()}
            total={d().total}
            onPrev={() => setOffset(Math.max(0, offset() - PAGE_SIZE))}
            onNext={() => setOffset(offset() + PAGE_SIZE)}
          />
        )}
      </Show>

      <RecordDetailDrawer
        record={detail()}
        onClose={() => setDetail(null)}
        onDelete={(r) => handleDelete(r)}
      />
    </div>
  )
}

function Pagination(props: {
  offset: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  const from = () => (props.total === 0 ? 0 : props.offset + 1)
  const to = () => Math.min(props.offset + PAGE_SIZE, props.total)
  return (
    <div {...stylex.attrs(styles.pagination)}>
      <span>
        {from()}–{to()} / 共 {props.total}
      </span>
      <Button size="sm" variant="secondary" disabled={props.offset === 0} onClick={props.onPrev}>
        上一页
      </Button>
      <Button size="sm" variant="secondary" disabled={to() >= props.total} onClick={props.onNext}>
        下一页
      </Button>
    </div>
  )
}

function formatTime(value: string | number): string {
  const ms = typeof value === "number" ? value * 1000 : Date.parse(value)
  return Number.isNaN(ms) ? String(value) : new Date(ms).toLocaleString()
}

function buildColumns(): TableColumn<SyncedRecord>[] {
  return [
    {
      key: "type",
      header: "类型",
      cell: (r) => (
        <Badge variant="neutral" size="sm">
          {r.recordType}
        </Badge>
      ),
    },
    {
      key: "recordId",
      header: "记录 ID",
      cell: (r) => <span {...stylex.attrs(styles.mono)}>{r.recordId}</span>,
    },
    {
      key: "owner",
      header: "Owner",
      cell: (r) => <span {...stylex.attrs(styles.ownerText)}>{r.ownerEmail ?? r.ownerId}</span>,
    },
    {
      key: "version",
      header: "版本",
      cell: (r) => <span {...stylex.attrs(styles.mono)}>v{r.version}</span>,
    },
    {
      key: "status",
      header: "状态",
      cell: (r) => (
        <Badge variant={r.deleted ? "danger" : "success"} size="sm">
          {r.deleted ? "已删除" : "有效"}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      header: "更新时间",
      cell: (r) => <span {...stylex.attrs(styles.ownerText)}>{formatTime(r.recordUpdatedAt)}</span>,
    },
  ]
}
