import type { Meta, StoryObj } from "storybook-solidjs"
import { Badge, CardSection, InlineError, Kbd } from "@tabora/ui"

const meta = {
  title: "Introduction/Contribution Guide",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "维护 `@tabora/ui` Storybook 时，所有基础组件都应在这里留下可验证的状态、交互和组合示例，避免文档与实现漂移。",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const pageStyle = {
  "min-height": "100vh",
  padding: "32px",
  background:
    "radial-gradient(circle at top left, rgb(var(--tbr-color-accent-soft)) 0%, rgb(var(--tbr-color-page)) 32%, rgb(var(--tbr-color-page)) 100%)",
}

const shellStyle = {
  width: "min(980px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: "20px",
}

const heroStyle = {
  padding: "28px",
  background: "rgb(var(--tbr-color-surface))",
  border: "1px solid rgb(var(--tbr-color-line))",
  "border-radius": "20px",
  "box-shadow": "0 24px 60px rgba(18, 24, 20, 0.08)",
  display: "grid",
  gap: "14px",
}

const gridStyle = {
  display: "grid",
  gap: "20px",
  "grid-template-columns": "repeat(auto-fit, minmax(280px, 1fr))",
}

export const Guide: Story = {
  render: () => (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <header style={heroStyle}>
          <Badge variant="accent">Storybook Governance</Badge>
          <h1 style={{ margin: 0, "font-size": "28px", "line-height": 1.2 }}>
            `@tabora/ui` Story 编写与维护约定
          </h1>
          <p
            style={{
              margin: 0,
              color: "rgb(var(--tbr-color-text-muted))",
              "font-size": "14px",
              "line-height": 1.7,
            }}
          >
            Storybook 在 Tabora
            里不是演示玩具，而是基础组件的可运行事实源。每次新增组件、变体或状态时，都要同步补齐
            story。
          </p>
          <div style={{ display: "flex", gap: "10px", "flex-wrap": "wrap" }}>
            <Badge>状态完整</Badge>
            <Badge variant="success">可访问</Badge>
            <Badge variant="warning">组合可读</Badge>
            <Badge variant="danger">避免文档漂移</Badge>
          </div>
        </header>

        <div style={gridStyle}>
          <CardSection title="每个组件至少覆盖">
            <ul style={{ margin: 0, padding: "0 0 0 18px", "line-height": 1.8 }}>
              <li>默认态、禁用态、错误态、加载态中的相关状态</li>
              <li>尺寸、变体、带值/空值等关键视觉分支</li>
              <li>至少一个贴近工作台真实密度的组合示例</li>
            </ul>
          </CardSection>

          <CardSection title="命名和组织">
            <ul style={{ margin: 0, padding: "0 0 0 18px", "line-height": 1.8 }}>
              <li>按 `Actions`、`Inputs`、`Selections`、`Overlays`、`Feedback` 等一级分类组织</li>
              <li>story 名称优先表达状态，不写模糊标题</li>
              <li>默认使用 `Meta` / `StoryObj`，不要回退到未类型化对象</li>
            </ul>
          </CardSection>

          <CardSection title="交互约定">
            <ul style={{ margin: 0, padding: "0 0 0 18px", "line-height": 1.8 }}>
              <li>本地交互优先用 `createSignal`，保持示例可运行</li>
              <li>不要在 story 里依赖 `alert`、`console.log` 这类低价值反馈</li>
              <li>需要异步态时，用确定性的 mock 状态表达，不连真实服务</li>
            </ul>
          </CardSection>

          <CardSection title="文档同步">
            <ul style={{ margin: 0, padding: "0 0 0 18px", "line-height": 1.8 }}>
              <li>新增组件后同步更新 `docs/product/tabora-design-system.md`</li>
              <li>组件协议变化时同步更新 `docs/README.md` 的 Storybook 入口说明</li>
              <li>若 story 仅为实验草稿，不要直接提交到主分组</li>
            </ul>
          </CardSection>
        </div>

        <CardSection title="提交前检查">
          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ margin: 0, color: "rgb(var(--tbr-color-text-muted))", "line-height": 1.7 }}>
              提交 Storybook
              相关改动前，至少执行下面两步。本地查看时优先检查深浅背景、键盘焦点和密度是否稳定。
            </p>
            <div
              style={{ display: "flex", gap: "10px", "flex-wrap": "wrap", "align-items": "center" }}
            >
              <Kbd>pnpm storybook</Kbd>
              <Kbd>pnpm storybook:build</Kbd>
            </div>
            <InlineError>
              如果组件实现已改动，但 story 没补，默认视为文档不完整，不应结束该任务。
            </InlineError>
          </div>
        </CardSection>
      </section>
    </main>
  ),
}
