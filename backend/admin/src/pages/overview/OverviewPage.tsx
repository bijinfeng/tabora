import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { InlineError } from "@tabora/ui/inline-error"
import { useQuery } from "@tanstack/solid-query"
import { For, Show } from "solid-js"

import { fetchSystemInfo } from "../system/systemApi"
import { fetchSyncedRecordStats } from "../synced-records/syncedRecordsApi"
import { BarChart, type BarDatum } from "./charts/BarChart"
import { ChartCard } from "./charts/ChartCard"
import { chartStyles } from "./charts/charts.styles"
import { Legend } from "./charts/Legend"
import { chartColor } from "./charts/palette"
import { RecordStateChart } from "./charts/RecordStateChart"
import { deriveHealthStatuses, type Metric } from "./overviewData"
import { styles } from "./overview.styles"

export function OverviewPage() {
  const stats = useQuery(() => ({
    queryKey: ["synced-records", "stats"],
    queryFn: fetchSyncedRecordStats,
  }))
  const system = useQuery(() => ({
    queryKey: ["system", "info"],
    queryFn: fetchSystemInfo,
  }))

  const metrics = (): Metric[] => {
    const s = stats.data
    const sys = system.data
    const typeSummary = s
      ? Object.entries(s.byType)
          .map(([t, n]) => `${t}: ${n}`)
          .join(" · ") || "暂无数据"
      : "加载中"
    return [
      { label: "用户总数", value: sys ? String(sys.counts.users) : "…", hint: "注册账号" },
      { label: "同步记录", value: s ? String(s.total) : "…", hint: typeSummary },
      { label: "Tombstone", value: s ? String(s.tombstones) : "…", hint: "已删除标记" },
      {
        label: "附件文件",
        value: sys ? String(sys.counts.attachmentFiles) : "…",
        hint: sys ? sys.storage.provider : "存储 Provider",
      },
    ]
  }

  const hasByType = () => Object.keys(stats.data?.byType ?? {}).length > 0
  const statsError = () => (stats.error as Error | null)?.message ?? null
  const systemError = () => (system.error as Error | null)?.message ?? null
  const healthStatuses = () => deriveHealthStatuses(system.data)

  const typeRows = (): BarDatum[] =>
    Object.entries(stats.data?.byType ?? {})
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)

  const queueRows = (): BarDatum[] => {
    const q = system.data?.emailQueue ?? { pending: 0, active: 0, completed: 0, failed: 0 }
    return [
      { label: "待发", value: q.pending, color: chartColor.warning },
      { label: "发送中", value: q.active, color: chartColor.info },
      { label: "已完成", value: q.completed, color: chartColor.success },
      { label: "失败", value: q.failed, color: chartColor.danger },
    ]
  }

  return (
    <div {...stylex.attrs(styles.page)}>
      <section {...stylex.attrs(styles.section)}>
        <h2 {...stylex.attrs(styles.sectionTitle)}>系统健康</h2>
        <Show when={systemError()}>
          <InlineError>{systemError()}</InlineError>
        </Show>
        <div {...stylex.attrs(styles.cardGrid)}>
          <For each={healthStatuses()}>
            {(item) => (
              <div {...stylex.attrs(styles.card)}>
                <div {...stylex.attrs(styles.cardHead)}>
                  <span {...stylex.attrs(styles.cardLabel)}>{item.label}</span>
                  <Badge variant={item.variant} size="sm">
                    {item.value}
                  </Badge>
                </div>
              </div>
            )}
          </For>
        </div>
      </section>

      <section {...stylex.attrs(styles.section)}>
        <h2 {...stylex.attrs(styles.sectionTitle)}>关键指标</h2>
        <div {...stylex.attrs(styles.cardGrid)}>
          <For each={metrics()}>
            {(metric) => (
              <div {...stylex.attrs(styles.card)}>
                <span {...stylex.attrs(styles.cardLabel)}>{metric.label}</span>
                <span {...stylex.attrs(styles.metricValue)}>{metric.value}</span>
                <Show when={metric.hint}>
                  <span {...stylex.attrs(styles.metricHint)}>{metric.hint}</span>
                </Show>
              </div>
            )}
          </For>
        </div>
      </section>

      <section {...stylex.attrs(styles.section)}>
        <h2 {...stylex.attrs(styles.sectionTitle)}>数据概览</h2>
        <div {...stylex.attrs(chartStyles.grid)}>
          <ChartCard
            title="同步记录类型分布"
            loading={stats.isPending}
            error={statsError()}
            hasData={hasByType()}
            emptyTitle="暂无同步记录"
            emptyDescription="客户端上传数据后，将按类型展示分布。"
          >
            <BarChart
              rows={typeRows()}
              fill={chartColor.accent}
              ariaLabel="同步记录类型分布柱状图"
            />
          </ChartCard>

          <ChartCard
            title="活跃 vs 已删除"
            loading={stats.isPending}
            error={statsError()}
            hasData={(stats.data?.total ?? 0) > 0}
            emptyTitle="暂无记录"
            emptyDescription="尚无同步记录可供统计。"
            aside={
              <Legend
                items={[
                  { label: "活跃", color: chartColor.accent },
                  { label: "已删除", color: chartColor.subtle },
                ]}
              />
            }
          >
            <RecordStateChart
              total={stats.data?.total ?? 0}
              tombstones={stats.data?.tombstones ?? 0}
            />
          </ChartCard>

          <ChartCard
            title="邮件队列状态"
            loading={system.isPending}
            error={systemError()}
            hasData={system.data !== undefined}
            emptyTitle="暂无队列数据"
            emptyDescription="接入邮件队列后展示各状态计数。"
          >
            <BarChart
              rows={queueRows()}
              fill={(row) => row.color ?? chartColor.accent}
              ariaLabel="邮件队列状态柱状图"
            />
          </ChartCard>
        </div>
      </section>
    </div>
  )
}
