import * as stylex from "@stylexjs/stylex"
import { Badge } from "@tabora/ui/badge"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Skeleton } from "@tabora/ui/skeleton"
import { createResource, For, Show } from "solid-js"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"
import { fetchSystemInfo } from "./systemApi"

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.s8,
    margin: "0 auto",
    maxWidth: 820,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: font.semibold,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: color.textMuted,
  },
  card: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    justifyContent: "space-between",
    minHeight: 44,
    paddingInline: space.s5,
    ":last-child": { borderBottomWidth: 0 },
  },
  rowLabel: {
    color: color.textMuted,
    fontSize: 13,
  },
  rowValue: {
    color: color.text,
    fontFamily: font.mono,
    fontSize: 12,
    maxWidth: 480,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  countsGrid: {
    display: "grid",
    gap: space.s4,
    gridTemplateColumns: "repeat(3, 1fr)",
  },
  countCard: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
    padding: space.s5,
  },
  countLabel: {
    color: color.textMuted,
    fontSize: 12,
  },
  countValue: {
    fontSize: 28,
    fontWeight: font.bold,
    lineHeight: 1.2,
  },
})

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return d > 0 ? `${d}天 ${h}时 ${m}分` : h > 0 ? `${h}时 ${m}分` : `${m}分 ${s}秒`
}

type RowItem = { label: string; value: string; badge?: "success" | "warning" }

function InfoCard(props: { rows: RowItem[] }) {
  return (
    <div {...stylex.attrs(styles.card)}>
      <For each={props.rows}>
        {(item) => (
          <div {...stylex.attrs(styles.row)}>
            <span {...stylex.attrs(styles.rowLabel)}>{item.label}</span>
            <span {...stylex.attrs(styles.rowValue)}>
              {item.badge ? (
                <Badge variant={item.badge} size="sm">
                  {item.value}
                </Badge>
              ) : (
                item.value
              )}
            </span>
          </div>
        )}
      </For>
    </div>
  )
}

export function SystemPage() {
  const [info] = createResource(fetchSystemInfo)

  return (
    <div {...stylex.attrs(styles.page)}>
      <Show when={info.loading}>
        <Skeleton />
      </Show>
      <Show when={info.error}>
        <InlineError>{(info.error as Error)?.message ?? "加载失败"}</InlineError>
      </Show>
      <Show when={info()}>
        {(d) => (
          <>
            <section {...stylex.attrs(styles.section)}>
              <h2 {...stylex.attrs(styles.sectionTitle)}>关键指标</h2>
              <div {...stylex.attrs(styles.countsGrid)}>
                <div {...stylex.attrs(styles.countCard)}>
                  <span {...stylex.attrs(styles.countLabel)}>用户总数</span>
                  <span {...stylex.attrs(styles.countValue)}>{d().counts.users}</span>
                </div>
                <div {...stylex.attrs(styles.countCard)}>
                  <span {...stylex.attrs(styles.countLabel)}>同步记录</span>
                  <span {...stylex.attrs(styles.countValue)}>{d().counts.syncRecords}</span>
                </div>
                <div {...stylex.attrs(styles.countCard)}>
                  <span {...stylex.attrs(styles.countLabel)}>附件文件</span>
                  <span {...stylex.attrs(styles.countValue)}>{d().counts.attachmentFiles}</span>
                </div>
              </div>
            </section>

            <section {...stylex.attrs(styles.section)}>
              <h2 {...stylex.attrs(styles.sectionTitle)}>服务运行时</h2>
              <InfoCard
                rows={[
                  { label: "版本", value: d().server.version },
                  { label: "Node.js", value: d().server.node },
                  { label: "启动时间", value: new Date(d().server.startedAt).toLocaleString() },
                  { label: "运行时长", value: formatUptime(d().server.uptimeSec) },
                  {
                    label: "认证密钥",
                    value: d().auth.secretConfigured ? "已配置（强密钥）" : "⚠ 密钥过短",
                    badge: d().auth.secretConfigured ? "success" : "warning",
                  },
                  { label: "认证基址", value: d().auth.baseUrl },
                ]}
              />
            </section>

            <section {...stylex.attrs(styles.section)}>
              <h2 {...stylex.attrs(styles.sectionTitle)}>数据库</h2>
              <InfoCard
                rows={[
                  { label: "驱动", value: d().database.client },
                  ...(d().database.client === "sqlite"
                    ? [{ label: "文件路径", value: d().database.file ?? "—" }]
                    : [{ label: "连接串", value: d().database.url ?? "—" }]),
                ]}
              />
            </section>

            <section {...stylex.attrs(styles.section)}>
              <h2 {...stylex.attrs(styles.sectionTitle)}>存储</h2>
              <InfoCard
                rows={[
                  { label: "Provider", value: d().storage.provider },
                  { label: "上传目录", value: d().storage.uploadsDir },
                ]}
              />
            </section>
          </>
        )}
      </Show>
      <Show when={!info.loading && !info.error && !info()}>
        <EmptyState title="无数据" description="无法获取系统信息。" />
      </Show>
    </div>
  )
}
