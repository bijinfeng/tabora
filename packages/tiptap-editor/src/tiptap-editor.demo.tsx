import * as stylex from "@stylexjs/stylex"
import { Component, createSignal, ErrorBoundary } from "solid-js"

import { FullTiptapEditor, TiptapEditor, compactToolbar } from "./tiptap-editor.styled"
import type { TiptapEditorProps, TiptapEditorSize } from "./tiptap-editor.styled"
import { defaultInsertMenuItems } from "./tiptap-editor-insert-menu"
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

export const TiptapEditorDemo: Component = () => {
  const [logEntries, setLogEntries] = createSignal<string[]>([])
  const pushLog = (kind: string, detail?: unknown) => {
    const now = new Date().toLocaleTimeString()
    let line = `${now}  ${kind}`
    if (detail !== undefined) {
      if (typeof detail === "string") line = `${line}  ${detail}`
      else if (
        typeof detail === "number" ||
        typeof detail === "boolean" ||
        typeof detail === "bigint"
      )
        line = `${line}  ${detail.toString()}`
      else line = `${line}  ${JSON.stringify(detail)}`
    }
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
          <div {...sx(demo.title)}>RichText 富文本编辑器 · 2 个示例</div>
          <div {...sx(demo.subtitle)}>
            按 shadcn 风格组织：Primitive + Styled 两层、Root / Content / Toolbar / Actions /
            FocusShell 可独立组合。基础编辑器将 Minimal、Standard、Insert Menu 与 Focus 合并：
            格式工具栏和聚焦模式均在底部插入菜单中按需切换。
          </div>
        </div>

        <div {...sx(demo.grid)}>
          <div {...sx(demo.card)}>
            <div {...sx(demo.label)}>1 · 可配置编辑器（插入菜单）</div>
            <div {...sx(demo.hint)}>
              默认使用紧凑格式工具栏；点击底部插入按钮可添加媒体、音频、文件、链接和位置，
              也可按需显示或隐藏格式工具栏、进入聚焦模式。
            </div>
            <TiptapEditor
              variant="focus"
              placeholder={PLACEHOLDER}
              content={BASE_CONTENT}
              toolbarItems={compactToolbar}
              insertMenuPrimitiveItems={defaultInsertMenuItems}
              onChange={(html) => {
                onChange(html)
                pushLog("Configurable html changed", `${html.length} chars`)
              }}
              onInsertKind={(kind) => {
                pushLog("insert-menu click", kind)
              }}
              onFocusModeChange={(open) => {
                pushLog("focus mode", open ? "open" : "close")
              }}
              onSave={(html, ctx) => {
                pushLog("Configurable save", `${html.length} chars · visibility=${ctx.visibility}`)
              }}
            />
          </div>

          <div {...sx(demo.card)}>
            <div {...sx(demo.label)}>2 · Full（全量工具栏 · 无底部栏）</div>
            <div {...sx(demo.hint)}>
              继承 Standard 的容器样式，使用完整 defaultToolbar，底部不带 actions。
            </div>
            <FullTiptapEditor
              placeholder={PLACEHOLDER}
              content={BASE_CONTENT}
              onChange={(html) => {
                onChange(html)
                pushLog("Full html changed", `${html.length} chars`)
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
              ? "（暂无事件：尝试编辑内容、点击保存，或在插入菜单中切换格式工具栏和聚焦模式）"
              : logEntries().join("\n")}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default TiptapEditorDemo
export type { TiptapEditorProps, TiptapEditorSize }
