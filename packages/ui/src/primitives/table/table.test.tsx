import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { Table } from "../../styled/table/table.styled"

describe("Table", () => {
  it("removes the last data row border so a following footer provides the only separator", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <Table
          columns={[{ key: "name", header: "名称", cell: (row: { name: string }) => row.name }]}
          rows={[{ name: "第一行" }, { name: "最后一行" }]}
          rowKey={(row) => row.name}
          aria-label="测试表格"
        />
      ),
      root,
    )

    const lastCell = root.querySelector<HTMLTableCellElement>("tbody tr:last-child td")
    expect(lastCell?.dataset.lastRow).toBe("")
    expect(lastCell?.className.length).toBeGreaterThan(0)
  })
})
