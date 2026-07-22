import * as stylex from "@stylexjs/stylex"
import { Accordion } from "./accordion.styled"

import { demoStyles } from "../demoStyles"
export function AccordionDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <Accordion
        defaultValue={["appearance"]}
        items={[
          {
            id: "plugins",
            title: "插件管理",
            content: null,
          },
          {
            id: "appearance",
            title: <span style={{ "font-weight": 400 }}>外观设置</span>,
            content: "选择明亮或暗色主题。控制卡片圆角大小、页面底色和强调色方案。",
          },
          {
            id: "search",
            title: "搜索偏好",
            content: null,
          },
        ]}
      />
    </div>
  )
}
