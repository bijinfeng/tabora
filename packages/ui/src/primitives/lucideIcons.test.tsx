import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Search } from "lucide-solid"
import { Accordion } from "./accordion/accordion"
import { Banner } from "./callout/callout"
import { Checkbox } from "./checkbox/checkbox"
import { Chip } from "./chip/chip"
import { Collapsible } from "./collapsible/collapsible"
import { CopyButton } from "./copyButton/copyButton"
import { Drawer } from "./drawer/drawer"
import { DropdownMenu } from "./dropdownMenu/dropdownMenu"
import { Pagination } from "./pagination/pagination"
import { Select } from "./select/select"
import { TagInput } from "./tagInput/tagInput"
import { Toast } from "./toast/toast"
import { TreeView } from "./treeView/treeView"

function root() {
  const el = document.createElement("div")
  document.body.appendChild(el)
  return el
}

function expectLucideIcon(container: Element | null) {
  expect(container).toBeTruthy()
  const icon = container?.querySelector("svg.lucide")
  expect(icon).toBeTruthy()
  expect(icon?.getAttribute("width")).toBe("16")
  expect(icon?.getAttribute("height")).toBe("16")
  expect(icon?.getAttribute("stroke-width")).toBe("2")
}

describe("built-in component icons", () => {
  it("renders form and menu affordances with lucide icons", () => {
    const el = root()
    render(
      () => (
        <>
          <Checkbox checked onChange={() => {}} aria-label="完成" />
          <Accordion items={[{ id: "one", title: "一", content: "内容" }]} />
          <Collapsible title="更多">内容</Collapsible>
          <Select<"a">
            value="a"
            options={[{ value: "a", label: "Apple" }]}
            onChange={() => {}}
            aria-label="水果"
          />
          <DropdownMenu
            open
            onOpenChange={() => {}}
            items={[
              { id: "enabled", label: "启用", checked: true },
              { id: "search", label: "搜索", icon: <Search size={16} strokeWidth={2} /> },
            ]}
          >
            菜单
          </DropdownMenu>
        </>
      ),
      el,
    )

    expectLucideIcon(el.querySelector("input[type='checkbox']")?.parentElement ?? null)
    expectLucideIcon(
      Array.from(el.querySelectorAll("button"))
        .find((button) => button.textContent?.includes("一"))
        ?.querySelector("span[aria-hidden='true']") ?? null,
    )
    expectLucideIcon(
      Array.from(el.querySelectorAll("button"))
        .find((button) => button.textContent?.includes("更多"))
        ?.querySelector("span[aria-hidden='true']") ?? null,
    )
    expectLucideIcon(el.querySelector("button[aria-label='水果']"))
    expect(document.body.querySelector("[data-checked] span[aria-hidden='true']")).toBeTruthy()
    expectLucideIcon(
      Array.from(document.body.querySelectorAll("[role='menuitem'], [role='menuitemcheckbox']"))
        .find((item) => item.textContent?.includes("搜索"))
        ?.querySelector("span") ?? null,
    )
  })

  it("renders close, remove, navigation, and copy actions with lucide icons", () => {
    const el = root()
    render(
      () => (
        <>
          <Chip removable>标签</Chip>
          <TagInput value={["设计"]} onChange={() => {}} aria-label="标签" />
          <Drawer open onClose={() => {}} title="设置">
            内容
          </Drawer>
          <Pagination page={2} total={3} onChange={() => {}} />
          <TreeView
            aria-label="文件"
            items={[{ id: "root", label: "根目录", children: [{ id: "child", label: "子项" }] }]}
            expandedIds={[]}
            onExpandedChange={() => {}}
          />
          <CopyButton value="tabora" />
        </>
      ),
      el,
    )

    expectLucideIcon(el.querySelector("button[aria-label='移除']"))
    expectLucideIcon(el.querySelector("button[aria-label='移除 设计']"))
    expectLucideIcon(document.body.querySelector("button[aria-label='关闭']"))
    expectLucideIcon(el.querySelector("button[aria-label='上一页']"))
    expectLucideIcon(el.querySelector("button[aria-label='下一页']"))
    expectLucideIcon(el.querySelector("button[aria-label='展开']"))
    expectLucideIcon(
      Array.from(el.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("复制"),
      ) ?? null,
    )
  })

  it("renders feedback status icons with lucide icons", () => {
    const el = root()
    render(
      () => (
        <>
          <Toast variant="success" title="已保存" />
          <Banner variant="warning" title="需要确认" />
        </>
      ),
      el,
    )

    const statuses = el.querySelectorAll("[role='status']")
    expectLucideIcon(statuses[0]?.querySelector("span[aria-hidden='true']") ?? null)
    expectLucideIcon(statuses[1]?.querySelector("span[aria-hidden='true']") ?? null)
  })
})
