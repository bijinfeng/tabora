import * as stylex from "@stylexjs/stylex"
import { createResource, createSignal, For, Show } from "solid-js"
import { Button, Input, Select } from "@tabora/ui"

import { fetchAuditLogs, deleteOldAuditLogs, type AuditLogFilters } from "./auditLogApi"
import { styles } from "./auditLog.styles"

export function AuditLogPage() {
  const [filters, setFilters] = createSignal<AuditLogFilters>({ limit: 50, offset: 0 })
  const [data] = createResource(filters, fetchAuditLogs)

  const [cleanupDays, setCleanupDays] = createSignal("90")
  const [cleanupMessage, setCleanupMessage] = createSignal("")

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
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

  const handleCleanup = async () => {
    try {
      const days = Number.parseInt(cleanupDays(), 10)
      if (Number.isNaN(days) || days < 1) {
        setCleanupMessage("请输入有效的天数（大于 0）")
        return
      }
      const result = await deleteOldAuditLogs(days)
      setCleanupMessage(`已删除 ${result.deletedCount} 条日志`)
      setFilters((prev) => ({ ...prev })) // 刷新列表
    } catch (error) {
      setCleanupMessage(`删除失败: ${(error as Error).message}`)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN")
  }

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.title)}>审计日志</h1>
      </div>

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

      <Show when={!data.loading && !data.error} fallback={<div>加载中...</div>}>
        <Show
          when={data()?.data.length}
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
              <For each={data()?.data}>
                {(log) => (
                  <tr {...stylex.props(styles.tr)}>
                    <td {...stylex.props(styles.td)}>{formatDate(log.createdAt)}</td>
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
              {Math.min((filters().offset ?? 0) + (filters().limit ?? 50), data()?.meta.total ?? 0)}{" "}
              / 共 {data()?.meta.total} 条
            </div>
            <div {...stylex.props(styles.paginationButtons)}>
              <Button onClick={handlePrevPage} disabled={!filters().offset}>
                上一页
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={
                  !data() ||
                  (filters().offset ?? 0) + (filters().limit ?? 50) >= (data()?.meta.total ?? 0)
                }
              >
                下一页
              </Button>
            </div>
          </div>
        </Show>
      </Show>

      <div {...stylex.props(styles.cleanupSection)}>
        <h3 {...stylex.props(styles.cleanupTitle)}>清理旧日志</h3>
        <div {...stylex.props(styles.cleanupForm)}>
          <div {...stylex.props(styles.filterGroup)}>
            <label {...stylex.props(styles.filterLabel)}>删除早于 N 天的日志</label>
            <Input
              placeholder="90"
              value={cleanupDays()}
              onInput={(value) => setCleanupDays(value)}
            />
          </div>
          <Button onClick={handleCleanup}>删除</Button>
        </div>
        <Show when={cleanupMessage()}>
          <p style={{ "margin-top": "8px", "font-size": "14px" }}>{cleanupMessage()}</p>
        </Show>
      </div>
    </div>
  )
}
