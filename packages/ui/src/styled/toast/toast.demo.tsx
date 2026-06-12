import { createSignal, For } from "solid-js"

import { Button } from "../button"
import { Toast } from "./toast.styled"

type DemoToast = {
  id: string
  variant: "info" | "success" | "warning" | "danger"
  title: string
  description: string
  action?: string
}

export function ToastDemo() {
  const [toasts, setToasts] = createSignal<DemoToast[]>([
    {
      id: "saved",
      variant: "success",
      title: "设置已保存",
      description: "工作区偏好已立即生效。",
    },
  ])

  const pushToast = (variant: "info" | "success" | "warning" | "danger") => {
    const config = {
      info: { title: "发现可用更新", description: "点击查看版本说明。", action: "查看" },
      success: { title: "插件安装成功", description: "现在可以添加到工作台。", action: "打开" },
      warning: { title: "存储空间不足", description: "部分数据未完成同步。", action: "清理" },
      danger: { title: "网络连接失败", description: "请检查代理或稍后重试。", action: "重试" },
    }[variant]

    setToasts((items) =>
      [
        {
          id: `${variant}-${items.length + 1}`,
          variant,
          title: config.title,
          description: config.description,
          action: config.action,
        },
        ...items,
      ].slice(0, 3),
    )
  }

  const removeToast = (id: string) => {
    setToasts((items) => items.filter((item) => item.id !== id))
  }

  return (
    <div class="docs-stack">
      <div class="docs-row">
        <Button size="sm" variant="secondary" onClick={() => pushToast("success")}>
          成功
        </Button>
        <Button size="sm" variant="secondary" onClick={() => pushToast("info")}>
          信息
        </Button>
        <Button size="sm" variant="secondary" onClick={() => pushToast("warning")}>
          警告
        </Button>
        <Button size="sm" variant="secondary" onClick={() => pushToast("danger")}>
          错误
        </Button>
      </div>
      <For each={toasts()}>
        {(toast) => (
          <Toast
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            action={toast.action}
            onAction={() => removeToast(toast.id)}
          />
        )}
      </For>
    </div>
  )
}
