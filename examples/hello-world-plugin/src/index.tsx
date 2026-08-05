import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { Field, Input, Button } from "@tabora/ui"
import { createSignal } from "solid-js"
import { For } from "solid-js"

// ============================================================
// Tabora 插件开发示例 — Hello World Widget
//
// 本文件展示开发 Tabora widget 插件所需的最小结构。
// 官方插件也必须遵守相同的协议。
// ============================================================

type Greeting = { id: string; text: string }

/**
 * Widget 视图组件。
 * 接收 WidgetViewProps，包含 instanceId / pluginId / contributionId / config / data。
 * 使用 @tabora/ui 基础组件确保控件一致性。
 */
export function HelloWorldCard(props: WidgetViewProps) {
  const [greetings, setGreetings] = createSignal<Greeting[]>([])
  const [input, setInput] = createSignal("")

  // 从插件数据加载持久化的问候语
  void props.data.get<Greeting[]>("greetings").then((saved) => {
    if (saved) setGreetings(saved)
  })

  async function addGreeting() {
    const text = input().trim()
    if (!text) return
    const next: Greeting[] = [...greetings(), { id: crypto.randomUUID(), text }]
    setGreetings(next)
    setInput("")
    await props.data.save("greetings", next)
  }

  return (
    <div style={{ padding: "12px" }}>
      <Field label="新问候语" htmlFor={`hw-input-${props.instanceId}`}>
        <div style={{ display: "flex", gap: "8px" }}>
          <Input
            id={`hw-input-${props.instanceId}`}
            value={input()}
            onInput={setInput}
            placeholder="输入一句问候..."
            aria-label="问候语"
          />
          <Button variant="primary" size="sm" onClick={() => void addGreeting()}>
            添加
          </Button>
        </div>
      </Field>
      <For each={greetings()}>
        {(greeting) => <div style={{ padding: "4px 0" }}>{greeting.text}</div>}
      </For>
    </div>
  )
}

// ============================================================
// 插件定义
// ============================================================

import type { PluginModule } from "@tabora/plugin-api/sdk"

/**
 * export default 或命名导出 PluginModule 对象。
 *
 * 必须包含：
 * - manifest: 声明插件 ID、名称、版本、贡献能力
 * - activate: 接收 PluginRuntimeContext，注册 view
 */
export const helloWorldPlugin: PluginModule = {
  manifest: {
    id: "example.hello-world",
    name: "Hello World",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },

    // 声明贡献的能力
    contributes: {
      widgets: [
        {
          id: "hello-world",
          title: "Hello World",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: {
            card: "example.hello-world.card",
          },
        },
      ],
    },
  },

  /**
   * activate 在插件被激活时由平台内核调用。
   * context 提供：
   *   - views.register(viewId, component)            注册本插件已声明视图
   *   - permissions.openExternal(url)                外部打开（权限桥）
   *   - ui.openModal / ui.closeModal                 模态窗口
   */
  activate(context) {
    context.views.register("example.hello-world.card", HelloWorldCard)
  },
}
