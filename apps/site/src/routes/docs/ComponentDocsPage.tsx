import { Button } from "@tabora/ui"
import { componentDocItems, getComponentDoc } from "@tabora/ui/component-docs"
import { useNavigate, useParams } from "@solidjs/router"
import { createMemo, For, Show } from "solid-js"

import { ComponentDocCard } from "./ComponentDocCard"
import { DocsShell } from "./DocsShell"

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
      <section class="docs-hero" aria-labelledby="docs-title">
        <div class="label">COMPONENT DOCS</div>
        <h1 id="docs-title">{pageTitle()}</h1>
        <p>
          官网只负责目录、路由和页面组装。具体组件 demo、代码片段和说明数据由
          `@tabora/ui/component-docs` 提供，随 UI 包一起维护。
        </p>
        <div class="docs-hero-actions">
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
          <section class="docs-component docs-empty-route">
            <div class="docs-component-head">
              <div>
                <h2>没有找到这个组件</h2>
                <p>请从左侧目录选择一个基础组件，或回到全部组件列表。</p>
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
