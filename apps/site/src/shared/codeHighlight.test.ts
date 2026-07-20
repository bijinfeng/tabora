import { describe, expect, it } from "vitest"

import { highlightCode } from "./codeHighlight"

describe("highlightCode", () => {
  it("highlights TSX snippets as TypeScript plus JSX instead of plain HTML", () => {
    const highlighted = highlightCode(`import { Badge } from "../badge"

export function TableDemo() {
  return <Table aria-label="插件状态" columns={[{ key: "name" }]} />
}`)

    expect(highlighted).toContain('data-code-token="keyword">import</span>')
    expect(highlighted).toContain('data-code-token="keyword">export</span>')
    expect(highlighted).toContain('data-code-token="keyword">return</span>')
    expect(highlighted).toContain('data-code-token="tag">Table</span>')
    expect(highlighted).toContain('data-code-token="attr">aria-label</span>')
    expect(highlighted).toContain('data-code-token="string">&quot;插件状态&quot;</span>')
    expect(highlighted).not.toContain('class="tbr-syn-')
  })

  it("highlights JSX nested inside TSX prop expressions", () => {
    const highlighted = highlightCode(`export function TableDemo() {
  return (
    <Table
      columns={[
        { key: "type", cell: (row) => <Badge variant="accent">{row.type}</Badge> },
      ]}
    />
  )
}`)

    expect(highlighted).toContain('data-code-token="tag">Table</span>')
    expect(highlighted).toContain('data-code-token="tag">Badge</span>')
    expect(highlighted).toContain('data-code-token="tag">/Badge</span>')
    expect(highlighted).toContain('data-code-token="attr">columns</span>')
    expect(highlighted).toContain('data-code-token="attr">variant</span>')
  })

  it("does not recolor keywords inside strings", () => {
    const highlighted = highlightCode(`const label = "import export return"`)

    expect(highlighted).toContain(
      'data-code-token="string">&quot;import export return&quot;</span>',
    )
  })

  it("does not treat object keys or property access as keywords", () => {
    const highlighted = highlightCode(`const row = { type: "widget" }
const value = row.type`)

    expect(highlighted).not.toContain('data-code-token="keyword">type</span>:')
    expect(highlighted).not.toContain("row.<span class=")
  })

  it("keeps plain HTML snippets on the HTML highlighter", () => {
    const highlighted = highlightCode(`<button aria-label="保存">保存</button>`)

    expect(highlighted).toContain('data-code-token="tag">button</span>')
    expect(highlighted).toContain('data-code-token="attr">aria-label</span>')
    expect(highlighted).not.toContain('data-code-token="keyword">const</span>')
  })
})
