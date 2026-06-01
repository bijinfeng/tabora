import type { Meta, StoryObj } from "storybook-solidjs"
import { Badge, Button, CardSection, Checkbox, Field, Input, InlineError } from "@tabora/ui"
import { createSignal } from "solid-js"

const meta = {
  title: "Introduction/Getting Started",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Tabora UI Storybook 是 `@tabora/ui` 基础组件库的示例与文档站点，用于核对组件状态、组合方式和视觉契约。",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const shellStyle = {
  "min-height": "100vh",
  padding: "32px",
  background:
    "linear-gradient(180deg, rgb(var(--tbr-color-page)) 0%, rgb(var(--tbr-color-surface-soft)) 100%)",
  color: "rgb(var(--tbr-color-text))",
}

const panelStyle = {
  width: "min(960px, 100%)",
  margin: "0 auto",
  padding: "32px",
  background: "rgb(var(--tbr-color-surface))",
  border: "1px solid rgb(var(--tbr-color-line))",
  "border-radius": "20px",
  "box-shadow": "0 20px 60px rgba(18, 24, 20, 0.08)",
  display: "grid",
  gap: "24px",
}

const sectionGridStyle = {
  display: "grid",
  gap: "16px",
  "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
}

export const Overview: Story = {
  render: () => {
    const [name, setName] = createSignal("")
    const [enabled, setEnabled] = createSignal(true)

    return (
      <main style={shellStyle}>
        <section style={panelStyle}>
          <header style={{ display: "grid", gap: "12px" }}>
            <Badge variant="accent">Tabora UI</Badge>
            <div style={{ display: "grid", gap: "8px" }}>
              <h1 style={{ margin: 0, "font-size": "28px", "line-height": 1.2 }}>
                基础组件示例与文档站
              </h1>
              <p
                style={{
                  margin: 0,
                  color: "rgb(var(--tbr-color-text-muted))",
                  "font-size": "14px",
                  "line-height": 1.6,
                }}
              >
                使用左侧导航浏览组件分类。每个 story 应覆盖关键状态、交互变体和在 Tabora
                工作台中的典型用法。
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", "flex-wrap": "wrap" }}>
              <Button variant="primary">查看 Actions</Button>
              <Button variant="secondary">查看 Inputs</Button>
            </div>
          </header>

          <div style={sectionGridStyle}>
            <CardSection
              title="组件分组"
              trailing={
                <span style={{ color: "rgb(var(--tbr-color-text-muted))", "font-size": "13px" }}>
                  基础组件
                </span>
              }
            >
              <p
                style={{
                  margin: "0 0 12px",
                  color: "rgb(var(--tbr-color-text-muted))",
                  "font-size": "14px",
                  "line-height": 1.6,
                }}
              >
                按 Action、Input、Selection、Overlay、Feedback 等类别组织 stories。
              </p>
              <ul
                style={{
                  margin: 0,
                  padding: "0 0 0 18px",
                  color: "rgb(var(--tbr-color-text-muted))",
                }}
              >
                <li>覆盖默认态、禁用态、错误态、加载态</li>
                <li>补充真实内容密度下的视觉检查</li>
                <li>优先展示插件内容区语义用法</li>
              </ul>
            </CardSection>

            <CardSection
              title="设计约束"
              trailing={
                <span style={{ color: "rgb(var(--tbr-color-text-muted))", "font-size": "13px" }}>
                  Design Token
                </span>
              }
            >
              <p
                style={{
                  margin: "0 0 12px",
                  color: "rgb(var(--tbr-color-text-muted))",
                  "font-size": "14px",
                  "line-height": 1.6,
                }}
              >
                视觉以 token 为中心，避免组件内部硬编码大面积颜色和布局假设。
              </p>
              <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
                <Badge>Token 驱动</Badge>
                <Badge variant="success">可访问</Badge>
                <Badge variant="warning">稳定尺寸</Badge>
              </div>
            </CardSection>
          </div>

          <CardSection title="快速交互示例">
            <div style={{ display: "grid", gap: "16px" }}>
              <p
                style={{
                  margin: 0,
                  color: "rgb(var(--tbr-color-text-muted))",
                  "font-size": "14px",
                  "line-height": 1.6,
                }}
              >
                用一个小场景确认表单、反馈和选择类组件在同一页面中的组合状态。
              </p>

              <Field
                label="工作台名称"
                helper="建议使用简短、可识别的名称。"
                error={name().trim() === "" ? "名称不能为空" : undefined}
                htmlFor="storybook-workspace-name"
              >
                <Input
                  id="storybook-workspace-name"
                  value={name()}
                  onInput={setName}
                  placeholder="例如：今日工作台"
                />
              </Field>

              <Checkbox
                checked={enabled()}
                onChange={(value) => setEnabled(value === true)}
                label="默认启用命令搜索"
              />

              {name().trim() === "" ? (
                <InlineError>请先输入工作台名称，再继续下一步。</InlineError>
              ) : null}
            </div>
          </CardSection>
        </section>
      </main>
    )
  },
}
