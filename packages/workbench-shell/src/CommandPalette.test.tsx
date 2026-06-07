import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { CommandPalette, type CommandItem } from "./CommandPalette"

const commands: CommandItem[] = [
  {
    id: "toggle-theme",
    icon: "🎨",
    name: "切换主题",
    desc: "明亮 ⇄ 暗色",
    shortcut: "⌘T",
    action: vi.fn(),
  },
  {
    id: "open-settings",
    icon: "⚙",
    name: "打开设置",
    desc: "配置工作台",
    shortcut: "⌘,",
    action: vi.fn(),
  },
  { id: "search-web", icon: "🔍", name: "搜索网页", desc: "直接搜索", action: vi.fn() },
]

describe("CommandPalette", () => {
  it("renders when open", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <CommandPalette isOpen={true} onClose={vi.fn()} commands={commands} />, root)
    expect(root.querySelector(".cmd-panel")).toBeTruthy()
    root.remove()
  })

  it("does not render when closed", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <CommandPalette isOpen={false} onClose={vi.fn()} commands={commands} />, root)
    expect(root.querySelector(".cmd-panel")).toBeNull()
    root.remove()
  })

  it("shows favorites when query is empty", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <CommandPalette isOpen={true} onClose={vi.fn()} commands={commands} />, root)
    expect(root.textContent).toContain("常用命令")
    expect(root.textContent).toContain("切换主题")
    root.remove()
  })

  it("filters commands by query", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <CommandPalette isOpen={true} onClose={vi.fn()} commands={commands} />, root)
    const input = root.querySelector(".cmd-input") as HTMLInputElement
    input.value = "设置"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    expect(root.textContent).toContain("打开设置")
    expect(root.textContent).not.toContain("切换主题")
    root.remove()
  })

  it("calls onClose on overlay click", () => {
    const onClose = vi.fn()
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <CommandPalette isOpen={true} onClose={onClose} commands={commands} />, root)
    const overlay = root.querySelector(".cmd-overlay")!
    overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(onClose).toHaveBeenCalled()
    root.remove()
  })

  it("navigates with ArrowDown and executes with Enter", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <CommandPalette isOpen={true} onClose={vi.fn()} commands={commands} />, root)
    const input = root.querySelector(".cmd-input") as HTMLInputElement
    input.value = "搜索"
    input.dispatchEvent(new Event("input", { bubbles: true }))

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    expect(commands[2]!.action).toHaveBeenCalled()
    root.remove()
  })

  it("closes on Escape", () => {
    const onClose = vi.fn()
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <CommandPalette isOpen={true} onClose={onClose} commands={commands} />, root)
    const input = root.querySelector(".cmd-input") as HTMLInputElement
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    expect(onClose).toHaveBeenCalled()
    root.remove()
  })

  it("does not fall back to the first provider when defaultProviderId is missing", () => {
    const openExternal = vi.fn(() => true)
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <CommandPalette
          isOpen={true}
          onClose={vi.fn()}
          commands={commands}
          providers={[
            {
              id: "official.search.google",
              title: "Google",
              shortcut: "g",
              urlTemplate: "https://google.example/search?q={query}",
            },
          ]}
          openExternal={openExternal}
        />
      ),
      root,
    )

    const input = root.querySelector(".cmd-input") as HTMLInputElement
    input.value = "tabora"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))

    expect(openExternal).not.toHaveBeenCalled()
    root.remove()
  })
})
