import { componentDocsCategories } from "@tabora/ui/component-docs"
import { A } from "@solidjs/router"
import { For } from "solid-js"

import { DocsShell } from "./DocsShell"

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
