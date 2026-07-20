import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Accordion, Collapsible, HoverCard, Popover, Tabs, Tooltip } from "../index"

const migratedClassFragments = [
  "tbr-accordion",
  "tbr-collapsible",
  "tbr-hover-card",
  "tbr-popover",
  "tbr-tabs",
  "tbr-tooltip",
]

describe("overlay component StyleX migration", () => {
  it("uses generated classes while preserving representative states", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <>
          <Accordion items={[{ id: "a", title: "协议", content: "内容" }]} />
          <Collapsible open title="更多设置">
            内容
          </Collapsible>
          <Tabs
            aria-label="视图"
            value="one"
            onChange={() => {}}
            tabs={[
              { value: "one", label: "概览", content: "概览内容" },
              { value: "two", label: "详情", content: "详情内容", disabled: true },
            ]}
          />
          <Tooltip content="提示">
            <button type="button">悬停</button>
          </Tooltip>
          <Popover defaultOpen title="弹层" trigger={<button type="button">打开</button>}>
            内容
          </Popover>
          <HoverCard trigger="插件" title="待办" description="官方插件" />
        </>
      ),
      root,
    )

    expect(root.querySelector("[aria-label='视图']")).not.toBeNull()
    expect(root.querySelector("[data-disabled]")).not.toBeNull()
    expect(root.querySelector("[data-expanded]")).not.toBeNull()

    for (const classFragment of migratedClassFragments) {
      expect(root.querySelector(`[class*='${classFragment}']`)).toBeNull()
      expect(document.body.querySelector(`[class*='${classFragment}']`)).toBeNull()
    }
  })
})
