import { Toast } from "./toast.styled"

export function ToastDemo() {
  return (
    <div class="docs-stack">
      <Toast variant="success" title="设置已保存" />
      <Toast variant="warning" title="网络不稳定" action="查看" />
    </div>
  )
}
