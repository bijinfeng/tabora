import * as stylex from "@stylexjs/stylex"
import { useMutation, useQuery, useQueryClient } from "@tanstack/solid-query"
import { createSignal, For, Show } from "solid-js"
import { CardSection } from "@tabora/ui"
import { Button } from "@tabora/ui/button"
import { Input } from "@tabora/ui/input"
import { Select } from "@tabora/ui/select"

import {
  fetchAuditLogs,
  deleteOldAuditLogs,
  type AuditLogRecord,
} from "../../server/admin/auditLog"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import { AdminPageLayout } from "../../components/AdminPageLayout"
import { styles } from "./auditLog.styles"

type FilterState = {
  userId?: string
  action?: string
  resourceType?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export function AuditLogPage() {
  const [filters, setFilters] = createSignal<FilterState>({ limit: 50, offset: 0 })
  const queryClient = useQueryClient()
  const data = useQuery(() => ({
    queryKey: ["audit-logs", filters()],
    queryFn: () =>
      fetchAuditLogs({
        data: {
          limit: filters().limit ?? 50,
          offset: filters().offset ?? 0,
          ...(filters().userId ? { userId: filters().userId } : {}),
          ...(filters().action ? { action: filters().action } : {}),
          ...(filters().resourceType ? { resourceType: filters().resourceType } : {}),
          ...(filters().startDate ? { startDate: filters().startDate } : {}),
          ...(filters().endDate ? { endDate: filters().endDate } : {}),
        },
      }),
  }))

  const [cleanupDays, setCleanupDays] = createSignal("90")
  const [cleanupMessage, setCleanupMessage] = createSignal("")
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = createSignal(false)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, offset: 0 }))
  }

  const handleNextPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset ?? 0) + (prev.limit ?? 50),
    }))
  }

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? 50)),
    }))
  }

  const cleanupMutation = useMutation(() => ({
    mutationFn: (days: number) => deleteOldAuditLogs({ data: { days } }),
    onSuccess: (result) => {
      setCleanupMessage(`已删除 ${result.deletedCount} 条日志`)
      setCleanupConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: ["audit-logs"] })
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

  return (
    <AdminPageLayout title="审计日志">
      <div {...stylex.props(styles.filters)}>
        <div {...stylex.props(styles.filterGroup)}>
          <label {...stylex.props(styles.filterLabel)}>用户 ID</label>
          <Input
            placeholder="筛选用户"
            value={filters().userId ?? ""}
            onInput={(value) => handleFilterChange("userId", value)}
          />
        </div>
        <div {...stylex.props(styles.filterGroup)}>
          <label {...stylex.props(styles.filterLabel)}>操作</label>
          <Input
            placeholder="如 POST /admin-api/users"
            value={filters().action ?? ""}
            onInput={(value) => handleFilterChange("action", value)}
          />
        </div>
        <div {...stylex.props(styles.filterGroup)}>
          <label {...stylex.props(styles.filterLabel)}>资源类型</label>
          <Select
            value={filters().resourceType ?? ""}
            onChange={(value) => handleFilterChange("resourceType", value)}
            options={[
              { value: "", label: "全部" },
              { value: "user", label: "用户" },
              { value: "settings", label: "设置" },
              { value: "attachment_policy", label: "附件策略" },
              { value: "synced_record", label: "同步记录" },
            ]}
          />
        </div>
        <div {...stylex.props(styles.filterGroup)}>
          <label {...stylex.props(styles.filterLabel)}>开始日期</label>
          <Input
            placeholder="YYYY-MM-DD"
            value={filters().startDate ?? ""}
            onInput={(value) => handleFilterChange("startDate", value)}
          />
        </div>
        <div {...stylex.props(styles.filterGroup)}>
          <label {...stylex.props(styles.filterLabel)}>结束日期</label>
          <Input
            placeholder="YYYY-MM-DD"
            value={filters().endDate ?? ""}
            onInput={(value) => handleFilterChange("endDate", value)}
          />
        </div>
      </div>

      <Show when={!data.isPending && !data.error} fallback={<div>加载中...</div>}>
        <Show
          when={data.data?.data.length}
          fallback={<div {...stylex.props(styles.emptyState)}>暂无审计日志</div>}
        >
          <table {...stylex.props(styles.table)}>
            <thead>
              <tr>
                <th {...stylex.props(styles.th)}>时间</th>
                <th {...stylex.props(styles.th)}>用户</th>
                <th {...stylex.props(styles.th)}>操作</th>
                <th {...stylex.props(styles.th)}>资源</th>
                <th {...stylex.props(styles.th)}>IP 地址</th>
              </tr>
            </thead>
            <tbody>
              <For each={data.data?.data}>
                {(log: AuditLogRecord) => (
                  <tr {...stylex.props(styles.tr)}>
                    <td {...stylex.props(styles.td)}>{formatDate(String(log.createdAt))}</td>
                    <td {...stylex.props(styles.td)}>{log.userId ?? "-"}</td>
                    <td {...stylex.props(styles.td)}>
                      <code>{log.action}</code>
                    </td>
                    <td {...stylex.props(styles.td)}>
                      <Show when={log.resourceType} fallback="-">
                        <span {...stylex.props(styles.badge)}>
                          {log.resourceType}
                          <Show when={log.resourceId}> #{log.resourceId}</Show>
                        </span>
                      </Show>
                    </td>
                    <td {...stylex.props(styles.td)}>{log.ipAddress ?? "-"}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>

          <div {...stylex.props(styles.pagination)}>
            <div {...stylex.props(styles.paginationInfo)}>
              显示 {(filters().offset ?? 0) + 1} -{" "}
              {Math.min(
                (filters().offset ?? 0) + (filters().limit ?? 50),
                data.data?.meta.total ?? 0,
              )}{" "}
              / 共 {data.data?.meta.total} 条
            </div>
            <div {...stylex.props(styles.paginationButtons)}>
              <Button onClick={handlePrevPage} disabled={!filters().offset}>
                上一页
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={
                  !data.data ||
                  (filters().offset ?? 0) + (filters().limit ?? 50) >= (data.data?.meta.total ?? 0)
                }
              >
                下一页
              </Button>
            </div>
          </div>
        </Show>
      </Show>

      <CardSection title="清理旧日志">
        <div {...stylex.props(styles.cleanupForm)}>
          <div {...stylex.props(styles.filterGroup)}>
            <label {...stylex.props(styles.filterLabel)}>删除早于 N 天的日志</label>
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
