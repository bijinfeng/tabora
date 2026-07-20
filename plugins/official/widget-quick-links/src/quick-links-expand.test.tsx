import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { QuickLinksExpand } from "./quick-links-expand"
import { QuickLinksExpandFooter } from "./quick-links-expand-footer"

function makeProps(overrides?: Partial<WidgetViewProps>): WidgetViewProps {
  return {
    instanceId: "quick-links-1",
    pluginId: "official.widgets.quick-links",
    contributionId: "quick-links",
    size: "M",
    supportedSizes: ["S", "M", "L"],
    config: { links: [] },
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
    host: {
      updateConfig: vi.fn().mockResolvedValue(undefined),
      removeInstance: vi.fn().mockResolvedValue(undefined),
      requestResize: vi.fn().mockResolvedValue(undefined),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      openExpand: vi.fn(),
      showToast: vi.fn(),
      openExternal: vi.fn().mockResolvedValue(true),
    },
    ...overrides,
  }
}

async function flushMount() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

// 同时挂载 body + footer 两个视图，复现 shell 的真实组合：
// 二者通过同一 instanceId 共享会话 store。
function renderExpand(props: WidgetViewProps) {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const dispose = render(
    () => (
      <>
        <QuickLinksExpand {...props} />
        <QuickLinksExpandFooter {...props} />
      </>
    ),
    root,
  )
  return { root, dispose }
}

function findButton(root: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find((btn) =>
    btn.textContent?.includes(text),
  )
}

describe("QuickLinksExpand", () => {
  it("renders default links, search and side config", async () => {
    const { root, dispose } = renderExpand(makeProps({ instanceId: "ql-render" }))
    await flushMount()

    expect(root.querySelector("[data-widget-expand='quick-links']")).toBeTruthy()
    expect(root.querySelector("[data-quick-links-side]")).toBeTruthy()
    expect(root.textContent).toContain("GitHub")
    expect(root.textContent).toContain("Notion")
    expect(root.textContent).toContain("/ 12")
    dispose()
    root.remove()
  })

  it("renders the action buttons in the footer view, not the body", async () => {
    const { root, dispose } = renderExpand(makeProps({ instanceId: "ql-footer" }))
    await flushMount()

    const footer = root.querySelector("[data-quick-links-footer]")
    expect(footer).toBeTruthy()
    expect(footer?.textContent).toContain("管理分组")
    expect(footer?.textContent).toContain("添加入口")
    // body 内不再自绘主要操作按钮
    const content = root.querySelector("[data-widget-expand='quick-links']")
    expect(content?.textContent).not.toContain("管理分组添加入口")
    dispose()
    root.remove()
  })

  it("clicking a link opens edit panel with pre-filled data", async () => {
    const openExternal = vi.fn().mockResolvedValue(true)
    const save = vi.fn().mockResolvedValue(undefined)
    const { root, dispose } = renderExpand(
      makeProps({
        instanceId: "ql-open",
        host: { ...makeProps().host, openExternal },
        data: { get: vi.fn().mockResolvedValue(undefined), save },
      }),
    )
    await flushMount()

    expect(root.querySelector('a[target="_blank"]')).toBeNull()
    const firstRow = root.querySelector("[data-quick-link-row]") as HTMLButtonElement
    expect(firstRow).toBeTruthy()
    firstRow.click()
    await flushMount()

    // Should switch to entry panel with pre-filled GitHub data
    const entryPanel = root.querySelector('[data-view="entry"]')
    expect(entryPanel).toBeTruthy()
    const urlInput = root.querySelector('input[type="url"]') as HTMLInputElement
    expect(urlInput?.value).toBe("https://github.com")
    dispose()
    root.remove()
  })

  it("footer button switches the body to the manage-groups panel (shared session)", async () => {
    const { root, dispose } = renderExpand(makeProps({ instanceId: "ql-groups" }))
    await flushMount()

    const manageBtn = findButton(root, "管理分组")
    expect(manageBtn).toBeTruthy()
    manageBtn!.click()
    await flushMount()

    const groupsPanel = root.querySelector('[data-view="groups"]')
    expect(groupsPanel).toBeTruthy()
    expect(groupsPanel?.textContent).toContain("工作")
    expect(groupsPanel?.textContent).toContain("设计")
    dispose()
    root.remove()
  })

  it("footer add-entry opens the entry panel and validates the url", async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { root, dispose } = renderExpand(
      makeProps({
        instanceId: "ql-entry",
        data: { get: vi.fn().mockResolvedValue(undefined), save },
      }),
    )
    await flushMount()

    const addBtn = findButton(root, "添加入口") as HTMLButtonElement
    expect(addBtn).toBeTruthy()
    addBtn.click()
    await flushMount()

    expect(root.querySelector('[data-view="entry"]')).toBeTruthy()

    // 空 URL 保存应报错，不写入
    const saveBtn = findButton(root, "保存入口") as HTMLButtonElement
    expect(saveBtn).toBeTruthy()
    saveBtn.click()
    await flushMount()

    expect(root.textContent).toContain("有效的 https")
    dispose()
    root.remove()
  })
})
