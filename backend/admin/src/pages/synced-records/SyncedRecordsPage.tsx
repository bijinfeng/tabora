import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { EmptyState } from "@tabora/ui/empty-state"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"
import { Table, type TableColumn } from "@tabora/ui/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"
import Search from "lucide-solid/icons/search"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import { Pagination } from "../../components/Pagination"
import { QueryState } from "../../components/QueryState"
import { useToast } from "../../contexts/ToastContext"
import { createDebounced } from "../../utils/createDebounced"
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
  const debouncedSearch = createDebounced(search, 300)
  const [offset, setOffset] = createSignal(0)
  const [detail, setDetail] = createSignal<SyncedRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = createSignal<SyncedRecord | null>(null)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const data = useQuery(() => ({
    queryKey: [
      "synced-records",
      { type: type(), deleted: deleted(), search: debouncedSearch(), offset: offset() },
    ],
    queryFn: () =>
      listSyncedRecords({
        limit: PAGE_SIZE,
        offset: offset(),
        ...(type() ? { type: type() } : {}),
        ...(deleted() ? { deleted: deleted() === "true" } : {}),
        ...(debouncedSearch() ? { search: debouncedSearch() } : {}),
      }),
  }))

  const deleteMutation = useMutation(() => ({
    mutationFn: (id: string) => deleteSyncedRecord(id),
    onSuccess: () => {
      setDetail(null)
      setDeleteTarget(null)
      showToast({ variant: "success", title: "记录已删除" })
      void queryClient.invalidateQueries({ queryKey: ["synced-records"] })
    },
    onError: (err: Error) => {
      showToast({ variant: "danger", title: "删除失败", description: err.message })
    },
  }))

  function confirmDelete() {
    const record = deleteTarget()
    if (!record || deleteMutation.isPending) return
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

      <QueryState
        error={data.error as Error | null}
        loading={data.isPending}
        hasRows={(data.data?.records.length ?? 0) > 0}
        empty={
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

      <RecordDetailDrawer
        record={detail()}
        onClose={() => setDetail(null)}
        onDelete={(r) => {
          setDetail(null)
          setDeleteTarget(r)
        }}
      />

      <ConfirmDialog
        open={deleteTarget() !== null}
        title="强制删除记录"
        description={`确认删除记录 ${deleteTarget()?.recordId ?? ""}？该操作不可撤销，将从服务端永久移除该同步记录。`}
        confirmLabel="删除"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
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
