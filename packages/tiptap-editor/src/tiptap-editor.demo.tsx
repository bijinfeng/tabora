import * as stylex from "@stylexjs/stylex"
import { Component, ErrorBoundary } from "solid-js"

import { TiptapEditor } from "./tiptap-editor.styled"
import type { TiptapEditorProps, TiptapEditorSize } from "./tiptap-editor.styled"
import { sx } from "./stylex"

const demo = stylex.create({
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
  },
  label: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 12,
    fontWeight: 650,
    marginBlockEnd: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
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

const WRAP_STYLE = {
  display: "flex" as const,
  "flex-direction": "column" as const,
  gap: "8px",
  width: "100%",
} as const

const LABEL_STYLE = {
  "font-size": "12px",
  "font-weight": 650,
  color: "rgb(var(--tbr-color-text-subtle))",
  "margin-block-end": "4px",
  "letter-spacing": "0.4px",
  "text-transform": "uppercase",
} as const

const ERROR_STYLE = {
  "background-color": "rgb(var(--tbr-color-danger-soft))",
  border: "1px solid rgb(var(--tbr-color-danger))",
  "border-radius": "8px",
  color: "rgb(var(--tbr-color-danger))",
  "font-family": "var(--tbr-font-mono)",
  "font-size": "12px",
  "line-height": 1.5,
  padding: "12px",
  "white-space": "pre-wrap",
} as const

export const TiptapEditorDemo: Component = () => {
  return (
    <ErrorBoundary
      fallback={(err) => (
        <div data-testid="tiptap-demo-wrap" {...sx(demo.wrap)} style={WRAP_STYLE}>
          <div {...sx(demo.label)} style={LABEL_STYLE}>
            RichText 富文本编辑器
          </div>
          <div {...sx(demo.error)} role="alert" aria-live="polite" style={ERROR_STYLE}>
            {err instanceof Error
              ? `富文本示例渲染失败：${err.name}: ${err.message}\n\n${err.stack ?? ""}`
              : `富文本示例渲染失败：${String(err)}`}
          </div>
        </div>
      )}
    >
      <div data-testid="tiptap-demo-wrap" {...sx(demo.wrap)} style={WRAP_STYLE}>
        <div data-testid="tiptap-demo-label" {...sx(demo.label)} style={LABEL_STYLE}>
          RichText 富文本编辑器
        </div>
        <TiptapEditor
          size="md"
          placeholder="请输入内容，支持 **粗体**、*斜体* 等 Markdown 快捷键…"
          onChange={(html) => console.warn("[TiptapEditorDemo] html changed", html.slice(0, 240))}
          content={
            "<h2>欢迎使用 Tiptap 编辑器</h2><p>这是一个基于 <strong>Tiptap</strong> + <code>Solid.js</code> 封装的富文本编辑器。</p><blockquote>它复用了 @tabora/ui 的基础组件与主题 token。</blockquote><ul><li>支持粗体、斜体、下划线、删除线</li><li>支持标题、列表、引用、代码块</li><li>支持链接、图片、对齐方式</li></ul>"
          }
        />
      </div>
    </ErrorBoundary>
  )
}

export default TiptapEditorDemo
export type { TiptapEditorProps, TiptapEditorSize }
