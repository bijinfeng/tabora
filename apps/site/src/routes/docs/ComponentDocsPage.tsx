import { Button } from "@tabora/ui"
import { componentDocItems, getComponentDoc } from "@tabora/ui/component-docs"
import { useNavigate, useParams } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"
import { createMemo, For, Show } from "solid-js"

import { ComponentDocCard } from "./ComponentDocCard"
import { DocsShell } from "./DocsShell"

const styles = stylex.create({
  hero: {
    display: "grid",
    gap: 16,
    maxWidth: 760,
    paddingBlock: "24px 12px",
  },
  label: {
    alignItems: "center",
    border: "1px solid currentColor",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-accent))",
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 760,
    minHeight: 24,
    paddingInline: 9,
    width: "fit-content",
  },
  title: {
    fontSize: 32,
    lineHeight: 1.2,
    margin: 0,
  },
  body: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    lineHeight: 1.62,
    margin: 0,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  empty: {
    borderTop: "1px solid rgb(var(--tbr-color-line))",
    display: "grid",
    gap: 14,
    paddingTop: 14,
  },
  emptyHead: {
    display: "grid",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    margin: "0 0 6px",
  },
})
export function ComponentDocsPage() {
  const params = useParams<{ componentId?: string }>()
  const navigate = useNavigate()
  const selectedDoc = createMemo(() =>
    params.componentId ? getComponentDoc(params.componentId) : undefined,
  )
  const isKnownRoute = createMemo(() => !params.componentId || Boolean(selectedDoc()))
  const visibleDocs = createMemo(() => (selectedDoc() ? [selectedDoc()!] : componentDocItems))
  const pageTitle = createMemo(() => selectedDoc()?.name ?? "基础组件使用文档")

  return (
    <DocsShell>
      <section {...stylex.attrs(styles.hero)} aria-labelledby="docs-title">
        <div {...stylex.attrs(styles.label)}>COMPONENT DOCS</div>
        <h1 {...stylex.attrs(styles.title)} id="docs-title">
          {pageTitle()}
        </h1>
        <p {...stylex.attrs(styles.body)}>
          官网只负责目录、路由和页面组装。具体组件 demo、代码片段和说明数据由
          `@tabora/ui/component-docs` 提供，随 UI 包一起维护。
        </p>
        <div {...stylex.attrs(styles.actions)}>
          <Button variant="primary" onClick={() => navigate("/docs/components")}>
            全部组件
          </Button>
          <Button variant="secondary" onClick={() => navigate("/docs/components/patterns")}>
            组合模式
          </Button>
        </div>
      </section>

      <Show
        when={isKnownRoute()}
        fallback={
          <section {...stylex.attrs(styles.empty)}>
            <div {...stylex.attrs(styles.emptyHead)}>
              <div>
                <h2 {...stylex.attrs(styles.emptyTitle)}>没有找到这个组件</h2>
                <p {...stylex.attrs(styles.body)}>
                  请从左侧目录选择一个基础组件，或回到全部组件列表。
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate("/docs/components")}>
              返回全部组件
            </Button>
          </section>
        }
      >
        <For each={visibleDocs()}>{(doc) => <ComponentDocCard doc={doc} />}</For>
      </Show>
    </DocsShell>
  )
}
