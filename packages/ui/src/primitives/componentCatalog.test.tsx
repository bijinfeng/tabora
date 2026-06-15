import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import {
  Alert,
  Banner,
  CommandPalette,
  ContextMenu,
  Drawer,
  HoverCard,
  Menubar,
  ScrollArea,
  Steps,
  Table,
  TagInput,
  Timeline,
  Toast,
  ToggleGroup,
  TreeView,
} from "../index"

describe("V2.3 component catalog", () => {
  it("exports and renders the missing base components from the component spec", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <TagInput aria-label="标签" value={["设计"]} onChange={vi.fn()} placeholder="输入标签" />
          <ToggleGroup
            aria-label="工作日"
            value={["mon"]}
            onChange={vi.fn()}
            options={[{ value: "mon", label: "周一" }]}
          />
          <ContextMenu
            items={[{ key: "rename", label: "重命名" }]}
            onSelect={vi.fn()}
            aria-label="卡片菜单"
          >
            <button type="button" aria-label="打开卡片菜单">
              菜单
            </button>
          </ContextMenu>
          <Drawer open title="详情" onClose={vi.fn()}>
            内容
          </Drawer>
          <HoverCard trigger="Tabora" title="插件工作台" description="协议优先" />
          <CommandPalette
            open
            query=""
            onQueryChange={vi.fn()}
            groups={[{ label: "命令", items: [{ id: "open", label: "打开" }] }]}
            onSelect={vi.fn()}
          />
          <Toast variant="success" title="设置已保存" />
          <Banner variant="info" title="新版本可用" description="包含新设计体系。" />
          <Alert variant="warning" title="注意" description="仅影响当前工作区。" />
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
          <Timeline items={[{ title: "创建插件", description: "manifest 已验证" }]} />
        </>
      ),
      root,
    )

    root
      .querySelector<HTMLButtonElement>("button[aria-label='打开卡片菜单']")
      ?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 12, clientY: 12 }))

    expect(root.textContent).toContain("设计")
    expect(root.textContent).toContain("周一")
    expect(document.body.textContent).toContain("重命名")
    expect(document.body.textContent).toContain("详情")
    expect(root.textContent).toContain("打开")
    expect(root.textContent).toContain("设置已保存")
    expect(root.textContent).toContain("插件")
    expect(root.textContent).toContain("根目录")
    expect(root.textContent).toContain("安装")
    expect(root.textContent).toContain("创建插件")
  })
})
