import * as stylex from "@stylexjs/stylex"
import { Component, createSignal, ErrorBoundary } from "solid-js"

import {
  MinimalTiptapEditor,
  StandardTiptapEditor,
  StandardMenuTiptapEditor,
  FocusTiptapEditor,
} from "./tiptap-editor.styled"
import type { TiptapEditorProps, TiptapEditorSize } from "./tiptap-editor.styled"
import { sx } from "./stylex"

const demo = stylex.create({
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    width: "100%",
    maxWidth: 1180,
    marginInline: "auto",
    paddingBlock: 24,
    paddingInline: 16,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "rgb(var(--tbr-color-text))",
  },
  subtitle: {
    fontSize: 13,
    color: "rgb(var(--tbr-color-text-subtle))",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 20,
    width: "100%",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "100%",
    minWidth: 0,
  },
  label: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  hint: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    lineHeight: 1.5,
  },
  error: {
    backgroundColor: "rgb(var(--tbr-color-danger-soft))",
    border: "1px solid rgb(var(--tbr-color-danger))",
    borderRadius: 8,
    color: "rgb(var(--tbr-color-danger))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
    lineHeight: 1.5,
    padding: 12,
    whiteSpace: "pre-wrap",
  },
})

const PLACEHOLDER = "此刻的想法…"

const BASE_CONTENT =
  "<p>在这里开始你的想法。所有示例共享同一份视觉基础，按 <strong>shadcn 风格</strong> 拆分为可组合的 primitive 与 styled 两层。</p>"

type DemoVariantItem = {
  id: string
  label: string
  hint: string
  render: (
    onChange: (html: string) => void,
    log: (kind: string, detail?: unknown) => void,
  ) => Component["prototype"]["render"]
}

export const TiptapEditorDemo: Component = () => {
  const [logEntries, setLogEntries] = createSignal<string[]>([])
  const pushLog = (kind: string, detail?: unknown) => {
    const now = new Date().toLocaleTimeString()
    const line = detail === undefined ? `${now}  ${kind}` : `${now}  ${kind}  ${String(detail)}`
    setLogEntries((prev) => [line, ...prev].slice(0, 30))
  }
  const onChange = (_html: string) => {
    // 避免频繁刷屏
  }

  return (
    <ErrorBoundary
      fallback={(err) => (
        <div {...sx(demo.wrap)}>
          <div {...sx(demo.card)} role="alert" aria-live="polite">
            <div {...sx(demo.label)}>RichText 富文本编辑器 · 渲染失败</div>
            <div {...sx(demo.error)}>
              {err instanceof Error
                ? `富文本示例渲染失败：${err.name}: ${err.message}\n\n${err.stack ?? ""}`
                : `富文本示例渲染失败：${String(err)}`}
            </div>
          </div>
        </div>
      )}
    >
      <div {...sx(demo.wrap)}>
        <div {...sx(demo.header)}>
          <div {...sx(demo.title)}>RichText 富文本编辑器 · 4 种样式变体</div>
          <div {...sx(demo.subtitle)}>
            按 shadcn 风格组织：Primitive + Styled 两层、Root / Content / Toolbar / Actions /
            FocusShell 可独立组合。以下示例分别对应 Minimal、Standard、Standard with Insert
            Menu、Focus。
          </div>
        </div>

        <div {...sx(demo.grid)}>
          <div {...sx(demo.card)}>
            <div {...sx(demo.label)}>1 · Minimal（无工具栏）</div>
            <div {...sx(demo.hint)}>
              适合发布框或评论输入：仅编辑区 + 底部插入 / 可见性 / 保存。
            </div>
            <MinimalTiptapEditor
              size="sm"
              placeholder={PLACEHOLDER}
              contentMinHeight={120}
              onChange={(html) => {
                onChange(html)
                pushLog("Minimal html changed", `${html.length} chars`)
              }}
              onSave={(html, ctx) => {
                pushLog("Minimal save", `${html.length} chars · visibility=${ctx.visibility}`)
              }}
            />
          </div>

          <div {...sx(demo.card)}>
            <div {...sx(demo.label)}>2 · Standard（紧凑工具栏）</div>
            <div {...sx(demo.hint)}>适用于普通正文编辑：标题切换、B/I/S、列表、对齐、代码块。</div>
            <StandardTiptapEditor
              placeholder={PLACEHOLDER}
              content={BASE_CONTENT}
              onChange={(html) => {
                onChange(html)
                pushLog("Standard html changed", `${html.length} chars`)
              }}
              onSave={(html, ctx) => {
                pushLog("Standard save", `${html.length} chars · visibility=${ctx.visibility}`)
              }}
            />
          </div>

          <div {...sx(demo.card)}>
            <div {...sx(demo.label)}>3 · Standard with Insert Menu（带插入菜单）</div>
            <div {...sx(demo.hint)}>
              点击底部 + 展开媒体 / 音频 / 文件 / 链接 / 位置，以及聚焦模式、格式工具栏开关。
            </div>
            <StandardMenuTiptapEditor
              placeholder={PLACEHOLDER}
              content={BASE_CONTENT}
              onChange={(html) => {
                onChange(html)
                pushLog("Menu html changed", `${html.length} chars`)
              }}
              onInsertKind={(kind) => pushLog("insert-menu click", kind)}
              onSave={(html, ctx) => {
                pushLog("Menu save", `${html.length} chars · visibility=${ctx.visibility}`)
              }}
            />
          </div>

          <div {...sx(demo.card)}>
            <div {...sx(demo.label)}>4 · Focus（聚焦模式）</div>
            <div {...sx(demo.hint)}>
              下方卡片底部会出现「进入聚焦」入口，点击后弹出屏幕居中的大编辑器。
            </div>
            <FocusTiptapEditor
              placeholder={PLACEHOLDER}
              content={BASE_CONTENT}
              onChange={(html) => {
                onChange(html)
                pushLog("Focus html changed", `${html.length} chars`)
              }}
              onFocusModeChange={(open) => pushLog("focus mode", open ? "open" : "close")}
              onSave={(html, ctx) => {
                pushLog("Focus save", `${html.length} chars · visibility=${ctx.visibility}`)
              }}
            />
          </div>
        </div>

        <div {...sx(demo.card)}>
          <div {...sx(demo.label)}>事件日志</div>
          <div
            {...sx(demo.hint)}
            role="log"
            aria-live="polite"
            style={{
              "font-family": "var(--tbr-font-mono)",
              "background-color": "rgb(var(--tbr-color-surface-soft))",
              padding: "12px 14px",
              "border-radius": "8px",
              "border-width": "1px",
              "border-style": "solid",
              "border-color": "rgb(var(--tbr-color-line))",
              "min-height": "140px",
              "white-space": "pre",
              "overflow-x": "auto",
            }}
          >
            {logEntries().length === 0
              ? "（暂无事件：尝试编辑内容、切换可见性、点击保存、打开 Standard-with-menu 的 + 菜单、或进入 Focus 模式）"
              : logEntries().join("\n")}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default TiptapEditorDemo
export type { TiptapEditorProps, TiptapEditorSize }
