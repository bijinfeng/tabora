import { Badge } from "../badge"
import { Accordion } from "./accordion.styled"

export function AccordionDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>插件接入问答</strong>
        <span>适合把概念说明、规则和低频信息分块收起，避免文档一屏过长。</span>
      </div>
      <Accordion
        items={[
          {
            id: "manifest",
            title: "Manifest 声明需要包含什么？",
            content: (
              <div class="docs-stack compact">
                <span>至少显式声明 `apiVersion`、插件 ID、版本和 contribution 列表。</span>
                <Badge variant="neutral">协议必填</Badge>
              </div>
            ),
          },
          {
            id: "runtime",
            title: "Runtime Context 应该怎么用？",
            content: (
              <div class="docs-stack compact">
                <span>插件通过 context 请求宿主能力，而不是直接访问宿主内部 store。</span>
                <Badge variant="accent">推荐路径</Badge>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
