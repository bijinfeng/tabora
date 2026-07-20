import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import {
  CommandPalette,
  ContextMenu,
  DatePicker,
  Dialog,
  Drawer,
  DropdownMenu,
  Menubar,
} from "../index"

const migratedClassFragments = [
  "tbr-command",
  "tbr-context-menu",
  "tbr-date-picker",
  "tbr-dialog",
  "tbr-drawer",
  "tbr-dropdown",
  "tbr-menubar",
]

describe("remaining overlay component StyleX migration", () => {
  it("uses generated classes while preserving representative states", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <CommandPalette
            open
            query=""
            onQueryChange={() => {}}
            onSelect={() => {}}
            groups={[
              {
                label: "插件",
                items: [{ id: "todo", label: "待办", description: "添加待办" }],
              },
            ]}
          />
          <ContextMenu
            aria-label="右键菜单"
            items={[{ key: "open", label: "打开", shortcut: "Enter" }]}
            onSelect={() => {}}
          >
            右键区域
          </ContextMenu>
          <DatePicker
            year={2026}
            month={6}
            value="2026-07-18"
            today="2026-07-18"
            markedDates={["2026-07-18"]}
          />
          <Dialog open onClose={() => {}} title="确认" description="继续操作" footer="底部" />
          <Drawer open onClose={() => {}} title="设置" description="工作区设置">
            内容
          </Drawer>
          <DropdownMenu
            open
            onOpenChange={() => {}}
            title="操作"
            items={[
              { id: "enabled", label: "启用", checked: true },
              { id: "delete", label: "删除", danger: true },
            ]}
          >
            菜单
          </DropdownMenu>
          <Menubar
            aria-label="菜单"
            value="home"
            onChange={() => {}}
            items={[
              { value: "home", label: "首页" },
              { value: "settings", label: "设置", disabled: true },
            ]}
          />
        </>
      ),
      root,
    )

    expect(document.body.querySelector("[aria-label='搜索命令']")).not.toBeNull()
    expect(root.querySelector("[aria-label='上个月']")).not.toBeNull()
    expect(root.querySelector("[aria-pressed='true']")).not.toBeNull()
    expect(document.body.querySelector("[role='dialog']")).not.toBeNull()
    expect(document.body.querySelector("[role='menu']")).not.toBeNull()

    for (const classFragment of migratedClassFragments) {
      expect(root.querySelector(`[class*='${classFragment}']`)).toBeNull()
      expect(document.body.querySelector(`[class*='${classFragment}']`)).toBeNull()
    }
  })
})
