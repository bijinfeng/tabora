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
      description: "默认搜索源和打开方式已立即生效。",
      action: "查看",
    },
  ])

  const pushToast = (variant: "info" | "success" | "warning" | "danger") => {
    const config = {
      info: { title: "发现配置变更", description: "同步队列中有 2 项待处理。", action: "查看" },
      success: {
        title: "工作区已同步",
        description: "所有设置都已推送到本地快照。",
        action: "详情",
      },
      warning: {
        title: "同步队列拥堵",
        description: "后台仍有 3 项等待上传。",
        action: "稍后处理",
      },
      danger: { title: "重新连接失败", description: "请检查网络或稍后再次重试。", action: "重试" },
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
      <div class="docs-stack compact">
        <strong>设置保存与同步反馈</strong>
        <span>演示不同优先级通知在同一工作区里的文案和动作差异。</span>
      </div>
      <div class="docs-row">
        <Button size="sm" variant="secondary" onClick={() => pushToast("success")}>
          保存成功
        </Button>
        <Button size="sm" variant="secondary" onClick={() => pushToast("info")}>
          查看同步
        </Button>
        <Button size="sm" variant="secondary" onClick={() => pushToast("warning")}>
          队列告警
        </Button>
        <Button size="sm" variant="secondary" onClick={() => pushToast("danger")}>
          重新连接
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
