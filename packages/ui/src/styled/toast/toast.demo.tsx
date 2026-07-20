import { Toast } from "./toast.styled"
import { demoStyles, sx } from "../demoStyles"

export function ToastDemo() {
  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.section)}>
        <h4 {...sx(demoStyles.sectionTitle)}>变体</h4>
        <div {...sx(demoStyles.toastRow)}>
          <Toast variant="success" title="设置已保存" />
          <Toast variant="danger" title="保存失败，请重试" />
          <Toast variant="warning" title="同步队列已暂停" action="重新连接" onAction={() => {}} />
          <Toast variant="info" title="新版本可用" action="更新" onAction={() => {}} />
        </div>
      </div>
    </div>
  )
}
