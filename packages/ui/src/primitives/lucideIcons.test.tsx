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

    expectLucideIcon(el.querySelector(".tbr-checkbox-control"))
    expectLucideIcon(el.querySelector(".tbr-accordion-arrow"))
    expectLucideIcon(el.querySelector(".tbr-collapsible-arrow"))
    expectLucideIcon(el.querySelector(".tbr-select-icon"))
    expect(document.body.querySelector(".tbr-dropdown-check")).toBeTruthy()
    expectLucideIcon(document.body.querySelector(".tbr-dropdown-icon"))
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
          <CopyButton class="tbr-copy-btn" value="tabora" />
        </>
      ),
      el,
    )

    expectLucideIcon(el.querySelector(".tbr-chip-remove"))
    expectLucideIcon(el.querySelector(".tbr-tag-input-remove"))
    expectLucideIcon(document.body.querySelector(".tbr-drawer-close"))
    expectLucideIcon(el.querySelector("button[aria-label='上一页']"))
    expectLucideIcon(el.querySelector("button[aria-label='下一页']"))
    expectLucideIcon(el.querySelector(".tbr-tree-toggle"))
    expectLucideIcon(el.querySelector(".tbr-copy-btn"))
  })

  it("renders feedback status icons with lucide icons", () => {
    const el = root()
    render(
      () => (
        <>
          <Toast class="tbr-toast" variant="success" title="已保存" />
          <Banner class="tbr-banner" variant="warning" title="需要确认" />
        </>
      ),
      el,
    )

    expectLucideIcon(el.querySelector(".tbr-toast-icon"))
    expectLucideIcon(el.querySelector(".tbr-callout-icon"))
  })
})
