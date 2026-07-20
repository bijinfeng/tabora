import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import {
  Alert,
  Avatar,
  Banner,
  Breadcrumb,
  Chip,
  CopyButton,
  Divider,
  Kbd,
  Link,
  Pagination,
  ScrollArea,
  Steps,
  Table,
  Timeline,
  Toast,
  TreeView,
  Truncate,
} from "../index"

const migratedClassFragments = [
  "tbr-alert",
  "tbr-avatar",
  "tbr-banner",
  "tbr-breadcrumb",
  "tbr-callout",
  "tbr-chip",
  "tbr-copy-btn",
  "tbr-divider",
  "tbr-kbd",
  "tbr-link",
  "tbr-page",
  "tbr-pagination",
  "tbr-scroll-area",
  "tbr-step",
  "tbr-steps",
  "tbr-table",
  "tbr-timeline",
  "tbr-toast",
  "tbr-tree",
]

describe("display component StyleX migration", () => {
  it("uses generated classes while preserving representative states", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <Avatar fallback="tb" />
          <Breadcrumb
            items={[
              { label: "首页", href: "/" },
              { label: "插件", current: true },
            ]}
          />
          <Banner variant="success" title="已保存" onClose={() => {}} />
          <Alert variant="danger" title="加载失败" description="稍后再试" />
          <Chip selected removable onRemove={() => {}}>
            标签
          </Chip>
          <CopyButton value="official.widget.todo" />
          <Divider />
          <Kbd>⌘K</Kbd>
          <Link href="/docs" muted>
            文档
          </Link>
          <Pagination page={2} total={4} onChange={() => {}} />
          <ScrollArea aria-label="滚动区域">内容</ScrollArea>
          <Steps
            current={1}
            steps={[{ title: "安装" }, { title: "启用", description: "立即生效" }]}
          />
          <Table
            aria-label="插件列表"
            columns={[
              { key: "name", header: "名称", cell: (row: { name: string }) => row.name },
              { key: "state", header: "状态", cell: (row: { state: string }) => row.state },
            ]}
            rows={[{ name: "Todo", state: "启用" }]}
            rowKey={(row) => row.name}
            selectedRowKeys={["Todo"]}
          />
          <Timeline items={[{ title: "同步", description: "已完成", meta: "刚刚" }]} />
          <Toast variant="warning" title="需要确认" action="查看" onAction={() => {}} />
          <TreeView
            aria-label="插件树"
            expandedIds={["root"]}
            onExpandedChange={() => {}}
            selectedId="child"
            items={[
              {
                id: "root",
                label: "官方插件",
                children: [{ id: "child", label: "待办" }],
              },
            ]}
          />
          <Truncate lines={2}>一段很长的插件说明文字</Truncate>
        </>
      ),
      root,
    )

    expect(root.querySelector("[aria-label='路径导航']")).not.toBeNull()
    expect(root.querySelector("[data-variant='success']")).not.toBeNull()
    expect(root.querySelector("[data-selected]")).not.toBeNull()
    expect(root.querySelector("[aria-label='插件列表']")).not.toBeNull()
    expect(root.querySelector("[role='tree']")).not.toBeNull()

    for (const classFragment of migratedClassFragments) {
      expect(root.querySelector(`[class*='${classFragment}']`)).toBeNull()
    }
  })
})
