import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { EmptyState } from "@tabora/ui/empty-state"
import type { TableColumn } from "@tabora/ui/table"
import { useMutation } from "@tanstack/solid-query"
import { createSignal } from "solid-js"
import Search from "lucide-solid/icons/search"

import { ConfirmDialog } from "../../components/ConfirmDialog"
import {
  AdminDataTablePanel,
  type AdminDataTableActions,
} from "../../components/AdminDataTablePanel"
import { useToast } from "../../contexts/ToastContext"
import { formatAdminTimestamp } from "../../utils/formatTimestamp"
import { shared } from "../shared.styles"
import { RecordDetailDrawer } from "./RecordDetailDrawer"
import { styles } from "./syncedRecords.styles"
import {
  deleteSyncedRecord,
  listSyncedRecords,
  type SyncedRecord,
} from "../../server/admin/syncedRecords"

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

type SyncedRecordsTableParams = {
  search: string
  type: string
  deleted: string
}

export function SyncedRecordsPage() {
  const [detail, setDetail] = createSignal<SyncedRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = createSignal<SyncedRecord | null>(null)
  const { showToast } = useToast()
  let tableActions: AdminDataTableActions | undefined

  const deleteMutation = useMutation(() => ({
    mutationFn: (id: string) => deleteSyncedRecord({ data: { id } }),
    onSuccess: () => {
      setDetail(null)
      setDeleteTarget(null)
      showToast({ variant: "success", title: "记录已删除" })
      tableActions?.reload()
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
    <div {...stylex.attrs(shared.page)}>
      <AdminDataTablePanel<SyncedRecord, SyncedRecordsTableParams>
        queryKey={["synced-records"]}
        request={async ({ current, pageSize, type, deleted, search }) => {
          const result = await listSyncedRecords({
            data: {
              limit: pageSize,
              offset: (current - 1) * pageSize,
              ...(type ? { type } : {}),
              ...(deleted ? { deleted: deleted === "true" } : {}),
              ...(search ? { search } : {}),
            },
          })
          return { data: result.records, total: result.total }
        }}
        pageSize={PAGE_SIZE}
        toolbar={{
          filters: [
            {
              key: "search",
              kind: "text",
              ariaLabel: "搜索同步记录",
              placeholder: "按记录 ID 搜索",
              leadingIcon: <Search size={16} />,
              clearable: true,
              grow: true,
            },
            {
              key: "type",
              kind: "select",
              ariaLabel: "按类型筛选",
              options: TYPE_OPTIONS,
            },
            {
              key: "deleted",
              kind: "select",
              ariaLabel: "按状态筛选",
              options: DELETED_OPTIONS,
            },
          ],
        }}
        columns={columns}
        rowKey={(r) => r.id}
        errorMessage="加载同步记录失败"
        empty={
          <EmptyState
            compact
            title="暂无同步记录"
            description="调整筛选条件，或等待客户端上传数据。"
          />
        }
        actionRef={(actions) => (tableActions = actions)}
        onRowClick={(r) => setDetail(r)}
        ariaLabel="同步记录列表"
      />

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
      cell: (r) => <span {...stylex.attrs(shared.mono)}>{r.recordId}</span>,
    },
    {
      key: "owner",
      header: "Owner",
      cell: (r) => <span {...stylex.attrs(styles.ownerText)}>{r.ownerEmail ?? r.ownerId}</span>,
    },
    {
      key: "version",
      header: "版本",
      cell: (r) => <span {...stylex.attrs(shared.mono)}>v{r.version}</span>,
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
      cell: (r) => (
        <span {...stylex.attrs(styles.ownerText)}>
          {formatAdminTimestamp(String(r.recordUpdatedAt))}
        </span>
      ),
    },
  ]
}
