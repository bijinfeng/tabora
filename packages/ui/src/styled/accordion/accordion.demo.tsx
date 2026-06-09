import { Accordion } from "./accordion.styled"

export function AccordionDemo() {
  return (
    <Accordion
      items={[
        { id: "manifest", title: "Manifest 声明", content: "声明贡献能力，不执行逻辑。" },
        { id: "runtime", title: "Runtime Context", content: "插件通过 context 请求宿主能力。" },
      ]}
    />
  )
}
