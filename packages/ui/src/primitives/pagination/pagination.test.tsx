import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { Pagination } from "../../styled/pagination/pagination.styled"

function root() {
  const el = document.createElement("div")
  document.body.appendChild(el)
  return el
}

describe("Pagination", () => {
  it("derives page count from total and pageSize, then reports both values on change", () => {
    const el = root()
    const changes: Array<[number, number]> = []

    render(
      () => (
        <Pagination
          current={2}
          total={42}
          pageSize={10}
          onChange={(page, pageSize) => changes.push([page, pageSize])}
        />
      ),
      el,
    )

    expect(el.textContent).toContain("5")
    el.querySelector<HTMLButtonElement>("button[aria-label='下一页']")?.click()
    expect(changes).toEqual([[3, 10]])
  })

  it("supports page-size, quick-jump, total summary, and hiding a single page", () => {
    const el = root()
    const changes: Array<[number, number]> = []

    render(
      () => (
        <>
          <Pagination
            defaultCurrent={2}
            total={42}
            defaultPageSize={10}
            showSizeChanger={{ options: [10, 20] }}
            showQuickJumper
            showTotal={(total, [from, to]) => `${from}-${to} / ${total}`}
            onChange={(page, pageSize) => changes.push([page, pageSize])}
          />
          <Pagination total={10} pageSize={10} hideOnSinglePage />
        </>
      ),
      el,
    )

    expect(el.textContent).toContain("11-20 / 42")
    expect(el.querySelectorAll("[data-tbr-pagination]")).toHaveLength(1)
    const select = el.querySelector<HTMLButtonElement>("button[aria-label='每页条数']")
    if (!select) throw new Error("missing page-size selector")

    const input = el.querySelector<HTMLInputElement>("input[placeholder='页码']")
    if (!input) throw new Error("missing quick-jump input")
    input.value = "4"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.closest("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
    expect(changes.at(-1)).toEqual([4, 10])
  })

  it("keeps step controls on editable simple-mode page numbers", () => {
    const el = root()
    render(
      () => (
        <Pagination current={3} total={80} pageSize={10} size="large" simple onChange={() => {}} />
      ),
      el,
    )

    expect(el.querySelector("[data-pagination-simple] button[aria-label='增加']")).toBeTruthy()
    expect(el.querySelector("[data-pagination-simple] button[aria-label='减少']")).toBeTruthy()
    expect(el.querySelector("[data-tbr-pagination]")?.getAttribute("data-size")).toBe("large")
  })
})
