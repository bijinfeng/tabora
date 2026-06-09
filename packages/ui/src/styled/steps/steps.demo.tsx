import { Steps } from "./steps.styled"

export function StepsDemo() {
  return (
    <Steps
      current={1}
      steps={[
        { title: "安装扩展", description: "打开新标签页" },
        { title: "启用插件", description: "选择默认卡片" },
        { title: "完成", description: "开始使用" },
      ]}
    />
  )
}
