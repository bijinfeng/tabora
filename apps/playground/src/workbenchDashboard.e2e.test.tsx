import { afterEach, describe, expect, it, vi } from "vitest"
import { page, userEvent } from "vitest/browser"
import { render } from "solid-js/web"

import { App } from "./App"

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

let disposeApp: (() => void) | undefined

describe("workbench dashboard layout", () => {
  afterEach(async () => {
    disposeApp?.()
    disposeApp = undefined
    document.body.innerHTML = ""
    document.documentElement.removeAttribute("style")
    document.body.removeAttribute("style")
    localStorage.clear()
    await deleteDatabase("tabora")
  })

  it("renders the plugin-provided dashboard shell and supports core widget interactions", async () => {
    await mountFreshWorkbench()

    const initial = await readWorkbenchSnapshot()

    expect(initial).toMatchObject({
      rail: true,
      railLabels: ["分组 我的工作台", "新建分组", "切换布局", "切换主题", "设置"],
      topbar: true,
      globalToolbar: false,
      layoutSwitch: true,
      grid: true,
      overflowX: false,
    })
    expect(initial.cardTitles).toEqual(["今日重点", "快捷入口", "待办", "便签", "天气"])

    clickRequired('.workbench-rail button[aria-label="新建分组"]')
    await waitFor(() => expect(document.querySelector(".dash-inline-pop.open")).toBeTruthy())
    expect(document.querySelector(".modal-container")).toBeFalsy()
    commitRailGroupName("Research")
    await waitFor(() =>
      expect(
        document.querySelector('.workbench-rail button[aria-label="分组 Research"]'),
      ).toBeTruthy(),
    )
    expect(document.querySelector(".dash-inline-pop.open")).toBeFalsy()

    const addBefore = countGridItems()
    clickRequired(".dash-add-widget-btn")
    await waitFor(() => expect(document.querySelector(".modal-container")).toBeTruthy())
    clickRequired(".add-widget-modal-item")
    await waitFor(() => expect(countGridItems()).toBe(addBefore + 1))

    expect(readHeaderSizeButtons("待办")).toEqual([])
    expect(readContextMenuSizeOptions("待办")).toEqual(["尺寸 S", "尺寸 M", "尺寸 L", "尺寸 XL"])

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

    const pluginsNavBtn = findButtonByText(".settings-nav", "插件")
    expect(pluginsNavBtn).toBeTruthy()
    ;(pluginsNavBtn as HTMLElement).click()
    await waitFor(() =>
      expect(document.querySelector(".settings-nav.active")?.textContent).toContain("插件"),
    )
    await waitFor(() => expect(document.querySelector(".plugin-list")).toBeTruthy())

    clickRequired(".settings-close")
    await waitFor(() => expect(document.querySelector(".settings-host")).toBeFalsy())

    clickRequired('.workbench-rail button[aria-label="设置"]')
    await waitFor(() => expect(document.querySelectorAll(".settings-drawer")).toHaveLength(1))
    const aboutNavBtn = findButtonByText(".settings-nav", "关于")
    expect(aboutNavBtn).toBeTruthy()
    ;(aboutNavBtn as HTMLElement).click()
    await waitFor(() =>
      expect(document.querySelector(".settings-nav.active")?.textContent).toContain("关于"),
    )
    await waitFor(() =>
      expect(document.querySelector(".settings-host")?.textContent).toContain(
        "当前工作区：默认工作区",
      ),
    )
    clickRequired(".settings-close")
    await waitFor(() => expect(document.querySelector(".settings-host")).toBeFalsy())

    const dragOrder = await dragFirstGridItemToSecond()
    expect(dragOrder.after).toEqual([
      dragOrder.before[1],
      dragOrder.before[0],
      ...dragOrder.before.slice(2),
    ])

    await expectNoHorizontalOverflow({ width: 1280, height: 900 })
    await expectNoHorizontalOverflow({ width: 768, height: 900 })
    await expectNoHorizontalOverflow({ width: 390, height: 844 })

    clickRequired('.workbench-rail button[aria-label="设置"]')
    await waitFor(() => expect(document.querySelector(".settings-drawer")).toBeTruthy())
    await waitFor(() => expect(hasHorizontalOverflow()).toBe(false))
    clickRequired(".settings-close")
    await waitFor(() => expect(document.querySelector(".settings-host")).toBeFalsy())

    clickRequired('.workbench-rail button[aria-label="切换布局"]')
    await waitFor(() => expect(document.querySelector(".dash-layout-switch-pop.open")).toBeTruthy())
    const focusLayoutButton = [
      ...document.querySelectorAll<HTMLElement>(".dash-layout-switch-item"),
    ].find((node) => node.textContent?.includes("Focus"))
    expect(focusLayoutButton).toBeTruthy()
    focusLayoutButton?.click()
    await waitFor(() => expect(document.querySelector('[data-layout="focus"]')).toBeTruthy())
    await waitFor(() => expect(document.querySelector(".focus-hero")).toBeTruthy())
    expect(document.querySelectorAll(".focus-satellite").length).toBeGreaterThan(0)
    await waitFor(() => expect(hasHorizontalOverflow()).toBe(false))

    clickRequired('[data-layout="focus"] .workbench-rail button[aria-label="设置"]')
    await waitFor(() => expect(document.querySelector(".settings-drawer")).toBeTruthy())
    await waitFor(() => expect(hasHorizontalOverflow()).toBe(false))
    clickRequired(".settings-close")
    await waitFor(() => expect(document.querySelector(".settings-host")).toBeFalsy())
  }, 45_000)
})

async function mountFreshWorkbench(): Promise<void> {
  await page.viewport(1280, 900)
  localStorage.clear()
  await deleteDatabase("tabora")
  document.body.innerHTML = '<div id="root"></div>'
  const root = document.getElementById("root")
  if (!root) {
    throw new Error("Root element #root was not found")
  }
  disposeApp = render(() => <App />, root)
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
    layoutSwitch: !!document.querySelector('.workbench-rail button[aria-label="切换布局"]'),
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

function readHeaderSizeButtons(title: string): string[] {
  const todo = readGridItemByTitle(title)
  return [...todo.querySelectorAll<HTMLElement>(".widget-size-btn")].map(
    (btn) => btn.textContent ?? "",
  )
}

function readContextMenuSizeOptions(title: string): string[] {
  const todo = readGridItemByTitle(title)
  todo.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      clientX: 24,
      clientY: 24,
    }),
  )
  const options = [...document.querySelectorAll<HTMLElement>(".ctx-menu-item")]
    .map((btn) => btn.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter((text) => text.startsWith("尺寸 "))
    .map((text) => text.replace("当前", "").trim())
  clickRequired(".ctx-menu-overlay")
  return options
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

  const sourceHeader = source.querySelector<HTMLElement>(".card-header")
  if (!sourceHeader) {
    throw new Error("Source widget header was not found for pointer drag")
  }

  const before = readGridOrder()
  await userEvent.dragAndDrop(sourceHeader, target)

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

function commitRailGroupName(name: string): void {
  const input = document.querySelector<HTMLInputElement>(".dash-inline-pop input")
  if (!input) {
    throw new Error("Rail inline group input was not found")
  }
  input.value = name
  input.dispatchEvent(new InputEvent("input", { bubbles: true }))
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
}

function hasHorizontalOverflow(): boolean {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth
}

async function expectNoHorizontalOverflow(viewport: {
  width: number
  height: number
}): Promise<void> {
  await page.viewport(viewport.width, viewport.height)
  await vi.waitFor(() => expect(hasHorizontalOverflow()).toBe(false))
}

async function waitFor(assertion: () => void | Promise<void>): Promise<void> {
  await vi.waitFor(assertion, { timeout: 2_000 })
}
