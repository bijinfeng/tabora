import { describe, expect, it } from "vitest"

import { highlightCode } from "./codeHighlight"

const classes = (html: string) => {
  const result = new Set<string>()
  html.replace(/class="([^"]*)"/g, (_m, list) => {
    for (const token of String(list).split(/\s+/)) {
      if (token) result.add(token)
    }
    return ""
  })
  return result
}

describe("highlightCode", () => {
  it("highlights TSX snippets as TypeScript plus JSX instead of plain HTML", () => {
    const highlighted = highlightCode(`import { Badge } from "../badge"

export function TableDemo() {
  return <Table aria-label="插件状态" columns={[{ key: "name" }]} />
}`)

    const set = classes(highlighted)

    expect(set.has("th-keyword")).toBe(true)
    expect(set.has("th-tag")).toBe(true)
    expect(set.has("th-attr")).toBe(true)
    expect(set.has("th-string")).toBe(true)
    expect(highlighted).toContain('th-keyword">import</span>')
    expect(highlighted).toContain('th-keyword">export</span>')
    expect(highlighted).toContain('th-keyword">return</span>')
    expect(highlighted).toContain('th-tag">Table</span>')
    expect(highlighted).toContain('th-attr">aria-label</span>')
    expect(highlighted).toContain('th-string">&quot;插件状态&quot;</span>')
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

    expect(highlighted).toContain('th-tag">Table</span>')
    expect(highlighted).toContain('th-tag">Badge</span>')
    expect(highlighted).toContain("&lt;/<span")
    expect(highlighted).toContain('th-attr">columns</span>')
    expect(highlighted).toContain('th-attr">variant</span>')
  })

  it("does not recolor tokens inside strings as keyword/tag/number spans", () => {
    const highlighted = highlightCode(`const label = "import export return"`)

    expect(highlighted).toContain('th-string">&quot;import export return&quot;</span>')

    const beforeString = highlighted.slice(0, highlighted.indexOf('th-string">&quot;import'))
    const afterString = highlighted.slice(highlighted.indexOf("return&quot;</span>"))
    expect(beforeString).toContain('th-keyword">const</span>')
    expect(afterString).not.toContain('th-keyword">')
  })

  it("keeps plain HTML snippets on the HTML highlighter", () => {
    const highlighted = highlightCode(`<button aria-label="保存">保存</button>`)

    expect(highlighted).toContain('th-tag">button</span>')
    expect(highlighted).toContain('th-attr">aria-label</span>')
    expect(highlighted).not.toContain('th-keyword">const</span>')
  })

  it("returns escaped plaintext tokens for unknown snippets", () => {
    const highlighted = highlightCode(`just some > text & stuff`)

    expect(highlighted).toContain("&gt;")
    expect(highlighted).toContain("&amp;")
  })
})
