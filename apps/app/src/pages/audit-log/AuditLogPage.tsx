import * as stylex from "@stylexjs/stylex"
import { useMutation } from "@tanstack/solid-query"
import { createSignal, Show } from "solid-js"
import { CardSection } from "@tabora/ui"
import { Button } from "@tabora/ui/button"
import { Input } from "@tabora/ui/input"
import type { TableColumn } from "@tabora/ui/table"

import {
  fetchAuditLogs,
  deleteOldAuditLogs,
  type AuditLogRecord,
} from "../../server/admin/auditLog"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import {
  AdminDataTablePanel,
  type AdminDataTableActions,
} from "../../components/AdminDataTablePanel"
import { AdminPageLayout } from "../../components/AdminPageLayout"
import { styles } from "./auditLog.styles"

type AuditLogTableParams = {
  userId: string
  action: string
  resourceType: string
  startDate: string
  endDate: string
}

export function AuditLogPage() {
  const [cleanupDays, setCleanupDays] = createSignal("90")
  const [cleanupMessage, setCleanupMessage] = createSignal("")
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = createSignal(false)
  let tableActions: AdminDataTableActions | undefined

  const cleanupMutation = useMutation(() => ({
    mutationFn: (days: number) => deleteOldAuditLogs({ data: { days } }),
    onSuccess: (result) => {
      setCleanupMessage(`已删除 ${result.deletedCount} 条日志`)
      setCleanupConfirmOpen(false)
      tableActions?.reload()
    },
    onError: (error: Error) => setCleanupMessage(`删除失败: ${error.message}`),
  }))

  const handleCleanup = () => {
    const days = Number.parseInt(cleanupDays(), 10)
    if (Number.isNaN(days) || days < 1) {
      setCleanupMessage("请输入有效的天数（大于 0）")
      return
    }
    setCleanupConfirmOpen(true)
  }

  const confirmCleanup = () => {
    const days = Number.parseInt(cleanupDays(), 10)
    if (!Number.isNaN(days) && days > 0 && !cleanupMutation.isPending) {
      cleanupMutation.mutate(days)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN")
  }

  const columns: TableColumn<AuditLogRecord>[] = [
    { key: "createdAt", header: "时间", cell: (log) => formatDate(String(log.createdAt)) },
    { key: "userId", header: "用户", cell: (log) => log.userId ?? "-" },
    { key: "action", header: "操作", cell: (log) => <code>{log.action}</code> },
    {
      key: "resource",
      header: "资源",
      cell: (log) => (
        <Show when={log.resourceType} fallback="-">
          <span {...stylex.props(styles.badge)}>
            {log.resourceType}
            <Show when={log.resourceId}> #{log.resourceId}</Show>
          </span>
        </Show>
      ),
    },
    { key: "ipAddress", header: "IP 地址", cell: (log) => log.ipAddress ?? "-" },
  ]

  return (
    <AdminPageLayout title="审计日志">
      <AdminDataTablePanel<AuditLogRecord, AuditLogTableParams>
        queryKey={["audit-logs"]}
        request={async ({
          current,
          pageSize,
          userId,
          action,
          resourceType,
          startDate,
          endDate,
        }) => {
          const result = await fetchAuditLogs({
            data: {
              limit: pageSize,
              offset: (current - 1) * pageSize,
              ...(userId ? { userId } : {}),
              ...(action ? { action } : {}),
              ...(resourceType ? { resourceType } : {}),
              ...(startDate ? { startDate } : {}),
              ...(endDate ? { endDate } : {}),
            },
          })
          return { data: result.data, total: result.meta.total }
        }}
        pageSize={50}
        toolbar={{
          layout: "form",
          filters: [
            {
              key: "userId",
              kind: "text",
              label: "用户 ID",
              ariaLabel: "按用户 ID 筛选",
              placeholder: "筛选用户",
            },
            {
              key: "action",
              kind: "text",
              label: "操作",
              ariaLabel: "按操作筛选",
              placeholder: "如 POST /admin-api/users",
            },
            {
              key: "resourceType",
              kind: "select",
              label: "资源类型",
              ariaLabel: "按资源类型筛选",
              options: [
                { value: "", label: "全部" },
                { value: "user", label: "用户" },
                { value: "settings", label: "设置" },
                { value: "attachment_policy", label: "附件策略" },
                { value: "synced_record", label: "同步记录" },
              ],
            },
            {
              key: "startDate",
              kind: "text",
              label: "开始日期",
              ariaLabel: "按开始日期筛选",
              placeholder: "YYYY-MM-DD",
            },
            {
              key: "endDate",
              kind: "text",
              label: "结束日期",
              ariaLabel: "按结束日期筛选",
              placeholder: "YYYY-MM-DD",
            },
          ],
        }}
        columns={columns}
        rowKey={(log) => String(log.id)}
        errorMessage="加载审计日志失败"
        empty={<div {...stylex.props(styles.emptyState)}>暂无审计日志</div>}
        actionRef={(actions) => (tableActions = actions)}
        ariaLabel="审计日志列表"
      />

      <CardSection title="清理旧日志">
        <div {...stylex.props(styles.cleanupForm)}>
          <div {...stylex.props(styles.cleanupField)}>
            <label {...stylex.props(styles.cleanupLabel)}>删除早于 N 天的日志</label>
            <Input
              placeholder="90"
              value={cleanupDays()}
              onInput={(value) => setCleanupDays(value)}
            />
          </div>
          <Button variant="danger-subtle" onClick={handleCleanup}>
            删除旧日志
          </Button>
        </div>
        <Show when={cleanupMessage()}>
          <p {...stylex.props(styles.cleanupMessage)}>{cleanupMessage()}</p>
        </Show>
      </CardSection>

      <ConfirmDialog
        open={cleanupConfirmOpen()}
        title="清理旧审计日志"
        description={`确认删除早于 ${cleanupDays()} 天的审计日志？该操作不可撤销。`}
        confirmLabel="删除日志"
        loading={cleanupMutation.isPending}
        error={(cleanupMutation.error as Error | null)?.message ?? null}
        onConfirm={confirmCleanup}
        onClose={() => setCleanupConfirmOpen(false)}
      />
    </AdminPageLayout>
  )
}
