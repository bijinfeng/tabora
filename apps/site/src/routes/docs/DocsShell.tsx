import { A } from "@solidjs/router"
import { For, type JSX } from "solid-js"

import { componentDocsCategories } from "@tabora/ui/component-docs"

export function DocsShell(props: { children: JSX.Element }) {
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
