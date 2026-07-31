import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { CommandPalette } from "@tabora/ui/command-palette"
import { ContextMenu } from "@tabora/ui/context-menu"
import { HoverCard } from "@tabora/ui/hover-card"
import { Menubar } from "@tabora/ui/menubar"
import { ScrollArea } from "@tabora/ui/scroll-area"
import { Steps } from "@tabora/ui/steps"
import { Table } from "@tabora/ui/table"
import { Toast } from "@tabora/ui/toast"
import { TreeView } from "@tabora/ui/tree-view"

describe("V2.3 component catalog", () => {
  it("exports and renders the missing base components from the component spec", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <ContextMenu
            items={[{ key: "rename", label: "重命名" }]}
            onSelect={vi.fn()}
            aria-label="卡片菜单"
          >
            <button type="button" aria-label="打开卡片菜单">
              菜单
            </button>
          </ContextMenu>
          <HoverCard trigger="Tabora" title="插件工作台" description="协议优先" />
          <CommandPalette
            open
            query=""
            onQueryChange={vi.fn()}
            groups={[{ label: "命令", items: [{ id: "open", label: "打开" }] }]}
            onSelect={vi.fn()}
          />
          <Toast variant="success" title="设置已保存" />
          <ScrollArea style={{ "max-height": "40px" }}>滚动内容</ScrollArea>
          <Table
            aria-label="插件"
            columns={[{ key: "name", header: "名称", cell: (row) => row.name }]}
            rows={[{ id: "plugin", name: "插件" }]}
            rowKey={(row) => row.id}
          />
          <TreeView
            aria-label="文件"
            items={[{ id: "root", label: "根目录", children: [{ id: "child", label: "文件" }] }]}
            expandedIds={["root"]}
            onExpandedChange={vi.fn()}
            onSelect={vi.fn()}
          />
          <Menubar
            aria-label="设置导航"
            value="general"
            onChange={vi.fn()}
            items={[{ value: "general", label: "通用" }]}
          />
          <Steps current={1} steps={[{ title: "安装" }, { title: "启用" }]} />
        </>
      ),
      root,
    )

    root
      .querySelector<HTMLButtonElement>("button[aria-label='打开卡片菜单']")
      ?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 12, clientY: 12 }))

    expect(document.body.textContent).toContain("重命名")
    expect(document.body.textContent).toContain("打开")
    expect(root.textContent).toContain("Tabora")
    expect(root.textContent).toContain("设置已保存")
    expect(root.textContent).toContain("滚动内容")
    expect(root.textContent).toContain("插件")
    expect(root.textContent).toContain("根目录")
    expect(root.textContent).toContain("通用")
    expect(root.textContent).toContain("安装")
  })
})
