import type { Meta, StoryObj } from "storybook-solidjs"
import { Badge, CardSection } from "@tabora/ui"

const meta = {
  title: "Introduction/Component Coverage",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "用矩阵方式盘点 `@tabora/ui` 组件在 Storybook 中的当前覆盖情况，帮助后续新增 story 时快速发现空缺。",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

type CoverageItem = {
  name: string
  category: string
  states: string[]
  stories: number
  notes?: string
}

const coverage: CoverageItem[] = [
  {
    name: "Button / IconButton",
    category: "Actions",
    states: ["default", "variant", "disabled", "loading", "size"],
    stories: 10,
  },
  { name: "CopyButton", category: "Actions", states: ["default", "custom label"], stories: 2 },
  {
    name: "Input",
    category: "Inputs",
    states: ["empty", "value", "invalid", "disabled", "size"],
    stories: 6,
  },
  {
    name: "Textarea",
    category: "Inputs",
    states: ["empty", "value", "invalid", "disabled", "readOnly"],
    stories: 5,
  },
  {
    name: "Select",
    category: "Inputs",
    states: ["empty", "value", "invalid", "disabled", "size"],
    stories: 5,
  },
  { name: "Combobox", category: "Inputs", states: ["search", "preset", "empty"], stories: 3 },
  { name: "Slider", category: "Inputs", states: ["default", "range", "step"], stories: 5 },
  {
    name: "Checkbox",
    category: "Selections",
    states: ["unchecked", "checked", "indeterminate", "disabled"],
    stories: 5,
  },
  {
    name: "Switch",
    category: "Selections",
    states: ["on", "off", "loading", "disabled", "size"],
    stories: 6,
  },
  {
    name: "RadioGroup",
    category: "Selections",
    states: ["vertical", "horizontal", "unselected"],
    stories: 3,
  },
  {
    name: "SegmentedControl",
    category: "Selections",
    states: ["default", "size", "two-options"],
    stories: 3,
  },
  {
    name: "Tabs",
    category: "Navigation",
    states: ["default", "stateful"],
    stories: 1,
    notes: "建议后续补充溢出或长标签场景",
  },
  { name: "Breadcrumb", category: "Navigation", states: ["default"], stories: 1 },
  { name: "Link", category: "Navigation", states: ["default", "external", "muted"], stories: 3 },
  {
    name: "Pagination",
    category: "Navigation",
    states: ["default", "edge"],
    stories: 1,
    notes: "建议后续补充大量页码场景",
  },
  { name: "Accordion", category: "Layout", states: ["default", "multiple"], stories: 1 },
  { name: "Collapsible", category: "Layout", states: ["default", "expanded"], stories: 1 },
  { name: "Field", category: "Layout", states: ["required", "helper", "error"], stories: 5 },
  {
    name: "CardSection",
    category: "Layout",
    states: ["padded", "no-title", "no-padding"],
    stories: 4,
  },
  { name: "Divider", category: "Layout", states: ["horizontal", "vertical"], stories: 1 },
  { name: "ListRow", category: "Layout", states: ["default", "meta", "actions"], stories: 1 },
  { name: "Badge", category: "Display", states: ["variant", "size"], stories: 8 },
  { name: "Avatar", category: "Display", states: ["image", "fallback", "size"], stories: 6 },
  { name: "Chip", category: "Display", states: ["selected", "removable"], stories: 4 },
  { name: "Kbd", category: "Display", states: ["single", "combo"], stories: 1 },
  { name: "Truncate", category: "Display", states: ["1-line", "2-line", "3-line"], stories: 4 },
  { name: "InlineError", category: "Feedback", states: ["default"], stories: 1 },
  { name: "Spinner", category: "Feedback", states: ["size", "inline"], stories: 1 },
  { name: "Skeleton", category: "Feedback", states: ["block", "text"], stories: 1 },
  { name: "Progress", category: "Feedback", states: ["value", "indeterminate"], stories: 1 },
  { name: "EmptyState", category: "Feedback", states: ["default", "action"], stories: 1 },
  { name: "Dialog", category: "Overlays", states: ["size", "destructive", "footer"], stories: 6 },
  {
    name: "DropdownMenu",
    category: "Overlays",
    states: ["basic", "shortcut", "danger"],
    stories: 3,
  },
  { name: "Popover", category: "Overlays", states: ["default", "custom content"], stories: 1 },
  { name: "Tooltip", category: "Overlays", states: ["placement", "trigger"], stories: 1 },
  {
    name: "VisuallyHidden",
    category: "Utility",
    states: ["paragraph", "button-label", "heading"],
    stories: 3,
  },
]

const pageStyle = {
  "min-height": "100vh",
  padding: "32px",
  background:
    "linear-gradient(180deg, rgb(var(--tbr-color-page)) 0%, rgb(var(--tbr-color-surface-soft)) 100%)",
}

const shellStyle = {
  width: "min(1120px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: "20px",
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
}

const thStyle = {
  padding: "12px 14px",
  textAlign: "left",
  color: "rgb(var(--tbr-color-text-muted))",
  borderBottom: "1px solid rgb(var(--tbr-color-line))",
  fontWeight: 600,
}

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid rgb(var(--tbr-color-line))",
  verticalAlign: "top",
}

function coverageTone(count: number) {
  if (count >= 5) return "success"
  if (count >= 3) return "warning"
  return "neutral"
}

export const Matrix: Story = {
  render: () => (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <header
          style={{
            padding: "28px",
            background: "rgb(var(--tbr-color-surface))",
            border: "1px solid rgb(var(--tbr-color-line))",
            "border-radius": "20px",
            "box-shadow": "0 20px 60px rgba(18, 24, 20, 0.08)",
            display: "grid",
            gap: "14px",
          }}
        >
          <Badge variant="accent">Coverage Matrix</Badge>
          <h1 style={{ margin: 0, "font-size": "28px", "line-height": 1.2 }}>Story 覆盖矩阵</h1>
          <p style={{ margin: 0, color: "rgb(var(--tbr-color-text-muted))", "line-height": 1.7 }}>
            这里记录每个 `@tabora/ui` 组件当前已经有哪些
            story、覆盖了哪些关键状态，以及仍建议补齐的方向。
          </p>
        </header>

        <CardSection title="组件总览">
          <div style={{ overflow: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>组件</th>
                  <th style={thStyle}>分类</th>
                  <th style={thStyle}>覆盖状态</th>
                  <th style={thStyle}>Story 数量</th>
                  <th style={thStyle}>备注</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((item) => (
                  <tr>
                    <td style={tdStyle}>
                      <strong>{item.name}</strong>
                    </td>
                    <td style={tdStyle}>{item.category}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                        {item.states.map((state) => (
                          <Badge size="sm">{state}</Badge>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <Badge variant={coverageTone(item.stories)}>{String(item.stories)}</Badge>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: "rgb(var(--tbr-color-text-muted))" }}>
                        {item.notes ?? "已覆盖当前基础路径"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardSection>
      </section>
    </main>
  ),
}
