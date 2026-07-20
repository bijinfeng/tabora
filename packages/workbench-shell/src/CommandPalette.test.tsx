import { createSignal } from "solid-js"
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

function Controlled(props: {
  isOpen?: boolean
  onClose?: () => void
  commands?: CommandItem[]
  [key: string]: unknown
}) {
  const [query, setQuery] = createSignal("")
  const [activeIdx, setActiveIdx] = createSignal(0)
  return (
    <CommandPalette
      isOpen={props.isOpen ?? true}
      query={query()}
      activeIdx={activeIdx()}
      onQueryChange={setQuery}
      onActiveIdxChange={(next) =>
        setActiveIdx(typeof next === "function" ? next(activeIdx()) : next)
      }
      onClose={props.onClose ?? vi.fn()}
      commands={props.commands ?? commands}
      {...(props as object)}
    />
  )
}

describe("CommandPalette", () => {
  it("renders when open", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Controlled isOpen={true} />, root)
    expect(root.querySelector("[data-command-palette-panel]")).toBeTruthy()
    expect(root.querySelector(".cmd-panel")).toBeNull()
    root.remove()
  })

  it("renders modal semantics and focuses the query input when opened", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Controlled isOpen={true} />, root)

    const overlay = root.querySelector("[data-command-palette-overlay]") as HTMLDivElement
    const input = root.querySelector("[data-command-palette-input]") as HTMLInputElement

    expect(overlay.getAttribute("role")).toBe("dialog")
    expect(overlay.getAttribute("aria-modal")).toBe("true")
    expect(document.activeElement).toBe(input)
    root.remove()
  })

  it("does not render when closed", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Controlled isOpen={false} />, root)
    expect(root.querySelector("[data-command-palette-panel]")).toBeNull()
    root.remove()
  })

  it("uses injected copy for placeholder and empty state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Controlled
          isOpen={true}
          commands={[]}
          widgets={[]}
          providers={[]}
          searchHistory={[]}
          copy={{
            placeholder: "Search commands, widgets, or type @bing weather",
            empty: "No results found",
          }}
        />
      ),
      root,
    )

    const input = root.querySelector("[data-command-palette-input]") as HTMLInputElement
    expect(input.placeholder).toBe("Search commands, widgets, or type @bing weather")
    expect(root.textContent).toContain("No results found")
    root.remove()
  })

  it("shows favorites when query is empty", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Controlled isOpen={true} />, root)
    expect(root.textContent).toContain("常用命令")
    expect(root.textContent).toContain("切换主题")
    root.remove()
  })

  it("filters commands by query", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Controlled isOpen={true} />, root)
    const input = root.querySelector("[data-command-palette-input]") as HTMLInputElement
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
    render(() => <Controlled isOpen={true} onClose={onClose} />, root)
    const overlay = root.querySelector("[data-command-palette-overlay]")!
    overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(onClose).toHaveBeenCalled()
    root.remove()
  })

  it("navigates with ArrowDown and executes with Enter", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Controlled isOpen={true} />, root)
    const input = root.querySelector("[data-command-palette-input]") as HTMLInputElement
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
    render(() => <Controlled isOpen={true} onClose={onClose} />, root)
    const input = root.querySelector("[data-command-palette-input]") as HTMLInputElement
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    expect(onClose).toHaveBeenCalled()
    root.remove()
  })

  it("does not fall back to the first provider when defaultProviderId is missing", () => {
    const openExternalForPlugin = vi.fn(() => true)
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Controlled
          isOpen={true}
          providers={[
            {
              id: "official.search.google",
              title: "Google",
              shortcut: "g",
              urlTemplate: "https://google.example/search?q={query}",
              pluginId: "official.search-providers.basic",
              pluginName: "基础搜索源",
            },
          ]}
          openExternalForPlugin={openExternalForPlugin}
        />
      ),
      root,
    )

    const input = root.querySelector("[data-command-palette-input]") as HTMLInputElement
    input.value = "tabora"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))

    expect(openExternalForPlugin).not.toHaveBeenCalled()
    root.remove()
  })

  it("opens web search through the selected provider owner", () => {
    const openExternalForPlugin = vi.fn(() => true)
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Controlled
          isOpen={true}
          providers={[
            {
              id: "official.search.google",
              title: "Google",
              shortcut: "g",
              urlTemplate: "https://google.example/search?q={query}",
              pluginId: "official.search-providers.basic",
              pluginName: "基础搜索源",
            },
          ]}
          defaultProviderId="official.search.google"
          openExternalForPlugin={openExternalForPlugin}
        />
      ),
      root,
    )

    const input = root.querySelector("[data-command-palette-input]") as HTMLInputElement
    input.value = "tabora governance"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))

    expect(openExternalForPlugin).toHaveBeenCalledWith({
      pluginId: "official.search-providers.basic",
      url: "https://google.example/search?q=tabora%20governance",
    })
    root.remove()
  })
})
