import { afterEach, describe, expect, it, vi } from "vitest"
import { page } from "vitest/browser"

type WorkbenchSnapshot = {
  rail: boolean
  railLabels: string[]
  topbar: boolean
  globalToolbar: boolean
  layoutSwitch: boolean
  grid: boolean
  cardTitles: string[]
  overflowX: boolean
}

describe("workbench dashboard layout", () => {
  afterEach(() => {
    document.body.innerHTML = ""
    document.documentElement.removeAttribute("style")
    document.body.removeAttribute("style")
    localStorage.clear()
  })

  it("renders the plugin-provided dashboard shell and supports core widget interactions", async () => {
    await mountFreshWorkbench()

    const initial = await readWorkbenchSnapshot()

    expect(initial).toMatchObject({
      rail: true,
      railLabels: ["主页", "添加卡片", "插件", "设置"],
      topbar: true,
      globalToolbar: false,
      layoutSwitch: true,
      grid: true,
      overflowX: false,
    })
    expect(initial.cardTitles).toEqual(["今日重点", "快捷入口", "便签", "待办"])

    const addBefore = countGridItems()
    clickRequired('.workbench-rail button[aria-label="添加卡片"]')
    await waitFor(() => expect(document.querySelector(".modal-container")).toBeTruthy())
    clickRequired(".add-widget-modal-item")
    await waitFor(() => expect(countGridItems()).toBe(addBefore + 1))

    expect(readTodoSizeOptions()).toEqual(["S", "M", "L", "XL"])

    clickRequired(readGridItemByTitle("便签"), ".card-action-btn")
    await waitFor(() => expect(document.querySelector(".expand-overlay .notes-modal")).toBeTruthy())
    clickRequired(".expand-close-btn")

    clickRequired('.workbench-rail button[aria-label="设置"]')
    await waitFor(() => expect(document.querySelector(".settings-drawer")).toBeTruthy())
    expect(document.querySelector(".settings-nav.active")?.textContent).toContain("外观")

    const searchNavBtn = findButtonByText(".settings-nav", "搜索")
    expect(searchNavBtn).toBeTruthy()
    expect(searchNavBtn?.textContent).toContain("搜索")
    ;(searchNavBtn as HTMLElement).click()
    await waitFor(() =>
      expect(document.querySelector(".settings-nav.active")?.textContent).toContain("搜索"),
    )

    await waitFor(() =>
      expect(document.querySelector("#settings-search-provider-select")).toBeTruthy(),
    )

    clickRequired(".settings-close")
    await waitFor(() => expect(document.querySelector(".settings-host")).toBeFalsy())

    clickRequired('.workbench-rail button[aria-label="插件"]')
    await waitFor(() => expect(document.querySelector(".settings-host")).toBeTruthy())
    expect(document.querySelector(".settings-nav.active")?.textContent).toContain("插件")
    clickRequired(".settings-close")

    const dragOrder = await dragFirstGridItemToSecond()
    expect(dragOrder.after).toEqual([
      dragOrder.before[1],
      dragOrder.before[0],
      ...dragOrder.before.slice(2),
    ])

    await page.viewport(390, 844)
    await vi.waitFor(() => expect(hasHorizontalOverflow()).toBe(false))
  }, 45_000)
})

async function mountFreshWorkbench(): Promise<void> {
  localStorage.clear()
  await deleteDatabase("tabora")
  document.body.innerHTML = '<div id="root"></div>'
  await import("./bootstrap")
  await vi.waitFor(() => expect(document.querySelector(".workbench-grid")).toBeTruthy(), {
    timeout: 5_000,
  })
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

async function readWorkbenchSnapshot(): Promise<WorkbenchSnapshot> {
  await page.viewport(1280, 900)

  return {
    rail: !!document.querySelector(".workbench-rail"),
    railLabels: [...document.querySelectorAll<HTMLElement>(".workbench-rail button")].map(
      (node) => node.getAttribute("aria-label") ?? "",
    ),
    topbar: !!document.querySelector(".dash-topbar .search-bar"),
    globalToolbar: !!document.querySelector(".toolbar"),
    layoutSwitch: !!document.querySelector(".layout-switch"),
    grid: !!document.querySelector(".workbench-grid"),
    cardTitles: [...document.querySelectorAll(".card-title-text")].map(
      (node) => node.textContent?.trim() ?? "",
    ),
    overflowX: hasHorizontalOverflow(),
  }
}

function countGridItems(): number {
  return document.querySelectorAll(".grid-item").length
}

function readTodoSizeOptions(): string[] {
  const todo = readGridItemByTitle("待办")
  return [...todo.querySelectorAll<HTMLElement>(".widget-size-btn")].map(
    (btn) => btn.textContent ?? "",
  )
}

function readGridItemByTitle(title: string): HTMLElement {
  const item = [...document.querySelectorAll<HTMLElement>(".grid-item")].find((node) =>
    node.textContent?.includes(title),
  )
  if (!item) {
    throw new Error(`Grid item was not found: ${title}`)
  }
  return item
}

async function dragFirstGridItemToSecond(): Promise<{ before: string[]; after: string[] }> {
  const items = [...document.querySelectorAll<HTMLElement>(".grid-item")]
  const source = items[0]
  const target = items[1]
  if (!source || !target) {
    throw new Error("At least two grid items are required for drag sorting")
  }

  const before = readGridOrder()
  const data = new DataTransfer()
  source.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: data }))
  target.dispatchEvent(
    new DragEvent("dragover", {
      bubbles: true,
      cancelable: true,
      dataTransfer: data,
    }),
  )
  target.dispatchEvent(
    new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: data,
    }),
  )

  await waitFor(() => expect(readGridOrder()).toEqual([before[1], before[0], ...before.slice(2)]))

  return {
    after: readGridOrder(),
    before,
  }
}

function readGridOrder(): string[] {
  return [...document.querySelectorAll(".grid-item")].map(
    (item) => item.getAttribute("aria-label") ?? "",
  )
}

function clickRequired(selectorOrRoot: string | ParentNode, selector?: string): void {
  const root = typeof selectorOrRoot === "string" ? document : selectorOrRoot
  const targetSelector = typeof selectorOrRoot === "string" ? selectorOrRoot : selector
  if (!targetSelector) {
    throw new Error("Click target selector is required")
  }

  const button = root.querySelector<HTMLElement>(targetSelector)
  if (!button) {
    throw new Error(`Clickable element was not found: ${targetSelector}`)
  }
  button.click()
}

function findButtonByText(selector: string, text: string): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>(selector)].find((node) =>
      node.textContent?.includes(text),
    ) ?? null
  )
}

function hasHorizontalOverflow(): boolean {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth
}

async function waitFor(assertion: () => void | Promise<void>): Promise<void> {
  await vi.waitFor(assertion, { timeout: 2_000 })
}
