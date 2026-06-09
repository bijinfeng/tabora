import { Badge } from "@tabora/ui"
import { ComponentDocDemo, type ComponentDocItem } from "@tabora/ui/component-docs"

export function ComponentDocCard(props: { doc: ComponentDocItem }) {
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
