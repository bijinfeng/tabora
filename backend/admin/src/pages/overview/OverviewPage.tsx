import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { EmptyState } from "@tabora/ui/empty-state"
import { useQuery } from "@tanstack/solid-query"
import { For, Show } from "solid-js"

import { fetchSyncedRecordStats } from "../synced-records/syncedRecordsApi"
import { healthStatuses, recentErrors, type Metric } from "./overviewData"
import { styles } from "./overview.styles"

export function OverviewPage() {
  const stats = useQuery(() => ({
    queryKey: ["synced-records", "stats"],
    queryFn: fetchSyncedRecordStats,
  }))

  const metrics = (): Metric[] => {
    const s = stats.data
    const typeSummary = s
      ? Object.entries(s.byType)
          .map(([t, n]) => `${t}: ${n}`)
          .join(" · ") || "暂无数据"
      : "加载中"
    return [
      { label: "用户总数", value: "—", hint: "见用户模块" },
      { label: "同步记录", value: s ? String(s.total) : "…", hint: typeSummary },
      { label: "Tombstone", value: s ? String(s.tombstones) : "…", hint: "已删除标记" },
      { label: "附件文件", value: "—", hint: "待接入" },
    ]
  }

  return (
    <div {...stylex.attrs(styles.page)}>
      <section {...stylex.attrs(styles.section)}>
        <h2 {...stylex.attrs(styles.sectionTitle)}>系统健康</h2>
        <div {...stylex.attrs(styles.cardGrid)}>
          <For each={healthStatuses}>
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
        <h2 {...stylex.attrs(styles.sectionTitle)}>最近同步错误</h2>
        <Show
          when={recentErrors.length > 0}
          fallback={
            <EmptyState
              title="暂无同步错误"
              description="接入服务端管理端点后，这里会展示被拒记录与冲突摘要。"
            />
          }
        >
          <For each={recentErrors}>{(error) => <div>{error.summary}</div>}</For>
        </Show>
      </section>
    </div>
  )
}
