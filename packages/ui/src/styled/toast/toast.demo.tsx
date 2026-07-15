import { Toast } from "./toast.styled"
import "./toast.demo.css"

export function ToastDemo() {
  return (
    <div class="docs-control-stack">
      <div class="demo-section">
        <h4>变体</h4>
        <div class="toast-row">
          <Toast variant="success" title="设置已保存" />
          <Toast variant="danger" title="保存失败，请重试" />
          <Toast variant="warning" title="网络连接不稳定" />
          <Toast variant="info" title="新版本可用" action="更新" onAction={() => {}} />
        </div>
      </div>

      <div class="demo-section">
        <h4>同步队列</h4>
        <div class="toast-row">
          <Toast variant="warning" title="同步队列已暂停" action="重新连接" onAction={() => {}} />
        </div>
      </div>
    </div>
  )
}
