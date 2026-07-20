import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Button } from "../button"
import { Checkbox } from "./checkbox.styled"

export function CheckboxDemo() {
  const [syncAll, setSyncAll] = createSignal(true)
  const [includeShortcuts, setIncludeShortcuts] = createSignal(false)
  const [includeTheme, setIncludeTheme] = createSignal(true)

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>同步到所有工作区</strong>
        <span>适合多选偏好项和批量同步场景。</span>
      </div>
      <Checkbox checked={syncAll()} onChange={setSyncAll} label="同步到所有工作区" />
      <Checkbox
        checked={includeShortcuts()}
        onChange={setIncludeShortcuts}
        label="包含快捷键配置"
      />
      <Checkbox checked={includeTheme()} onChange={setIncludeTheme} label="包含主题与背景" />
      <div {...stylex.attrs(demoStyles.row)}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSyncAll(true)
            setIncludeShortcuts(false)
            setIncludeTheme(true)
          }}
        >
          恢复推荐项
        </Button>
        <span>
          将同步 {syncAll() ? "全部工作区" : "当前工作区"} ·
          {includeShortcuts() ? " 含快捷键" : " 不含快捷键"} ·
          {includeTheme() ? " 含主题" : " 不含主题"}
        </span>
      </div>
    </div>
  )
}
