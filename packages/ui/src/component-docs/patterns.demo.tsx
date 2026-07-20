import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../styled/demoStyles"
import { Alert } from "../styled/callout"
import { Badge } from "../styled/badge"
import { Button } from "../styled/button"
import { CardSection } from "../styled/cardSection"
import { Field } from "../styled/field"
import { ListRow } from "../styled/listRow"
import { Select } from "../styled/select"
import { Switch } from "../styled/switch"

const searchSourceOptions = [
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
  { value: "docs", label: "文档" },
] as const

export function PatternsDemo() {
  const [enabled, setEnabled] = createSignal(true)
  const [selectValue, setSelectValue] = createSignal<"google" | "github" | "docs">("google")

  return (
    <div {...stylex.attrs(demoStyles.patternGrid)}>
      <CardSection title="插件设置">
        <div {...stylex.attrs(demoStyles.stack)}>
          <ListRow
            primary="启用插件"
            trailing={<Switch checked={enabled()} onChange={setEnabled} aria-label="启用插件" />}
          />
          <ListRow primary="插件状态" trailing={<Badge variant="success">运行中</Badge>} />
          <Alert variant="info" title="提示" description="设置会立即保存在本地。" />
        </div>
      </CardSection>
      <CardSection title="搜索配置">
        <div {...stylex.attrs(demoStyles.stack)}>
          <Field label="默认搜索源" htmlFor="pattern-search">
            <Select
              id="pattern-search"
              value={selectValue()}
              onChange={setSelectValue}
              options={[...searchSourceOptions]}
            />
          </Field>
          <Button variant="primary" size="sm">
            保存
          </Button>
        </div>
      </CardSection>
    </div>
  )
}
