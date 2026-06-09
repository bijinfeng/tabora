import { Badge, Button } from "@tabora/ui"
import {
  ComponentDocDemo,
  componentDocItems,
  componentDocsCategories,
  getComponentDoc,
  type ComponentDocItem,
} from "@tabora/ui/component-docs"
import { A, useNavigate, useParams } from "@solidjs/router"
import { createMemo, For, type JSX, Show } from "solid-js"

function DocsShell(props: { children: JSX.Element }) {
  return (
    <main class="docs-page">
      <aside class="docs-sidebar" aria-label="基础组件目录">
        <div class="docs-sidebar-title">基础组件</div>
        <A class="docs-sidebar-link docs-sidebar-home" href="/docs" end>
          文档总览
        </A>
        <A class="docs-sidebar-link docs-sidebar-home" href="/docs/components">
          全部组件
        </A>
        <For each={componentDocsCategories}>
          {(category) => (
            <section>
              <div class="docs-sidebar-section">{category.title}</div>
              <For each={category.items}>
                {(item) => (
                  <A class="docs-sidebar-link" href={`/docs/components/${item.id}`}>
                    {item.name}
                  </A>
                )}
              </For>
            </section>
          )}
        </For>
      </aside>
      <div class="docs-content">{props.children}</div>
    </main>
  )
}

function ComponentDocCard(props: { doc: ComponentDocItem }) {
  return (
    <section class="docs-component" id={props.doc.id}>
      <div class="docs-component-head">
        <div>
          <h2>{props.doc.title}</h2>
          <p>{props.doc.purpose}</p>
        </div>
        <Badge variant="accent">real render</Badge>
      </div>
      <div class="docs-component-grid">
        <div class="docs-demo-panel">
          <div class="docs-panel-label">使用方案</div>
          <p>{props.doc.usage}</p>
          <div class="docs-render">
            <ComponentDocDemo id={props.doc.id} />
          </div>
        </div>
        <div class="docs-code-panel">
          <div class="docs-panel-label">代码示例</div>
          <pre>
            <code>{props.doc.code}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}

export function DocsHomePage() {
  return (
    <DocsShell>
      <section class="docs-home-hero" aria-labelledby="docs-home-title">
        <div class="label">TABORA DOCS</div>
        <h1 id="docs-home-title">官网文档</h1>
        <p>
          这里把官网文档拆成可导航目录。基础组件页使用真实 `@tabora/ui`
          渲染，方便逐项对照最新组件规范检查还原度。
        </p>
        <div class="docs-hero-actions">
          <A class="docs-link-action primary" href="/docs/components">
            查看全部组件
          </A>
          <A class="docs-link-action secondary" href="/docs/components/patterns">
            查看组合模式
          </A>
        </div>
      </section>

      <section class="docs-home-grid" aria-label="文档目录">
        <For each={componentDocsCategories}>
          {(category) => (
            <article class="docs-home-card">
              <div>
                <h2>{category.title}</h2>
                <p>{category.items.length} 个条目</p>
              </div>
              <div class="docs-home-links">
                <For each={category.items}>
                  {(item) => <A href={`/docs/components/${item.id}`}>{item.name}</A>}
                </For>
              </div>
            </article>
          )}
        </For>
      </section>
    </DocsShell>
  )
}

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
