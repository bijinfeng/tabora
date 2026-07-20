import * as stylex from "@stylexjs/stylex"
import type { ShellTranslation } from "../i18n"
import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

const styles = stylex.create({
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    minHeight: 0,
  },
  panel: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    padding: space.s5,
  },
  title: {
    fontSize: 14,
    fontWeight: font.bold,
    marginBottom: space.s4,
  },
  body: {
    color: color.textMuted,
    display: "grid",
    fontSize: 13,
    gap: space.s3,
    lineHeight: 1.45,
  },
  paragraph: {
    margin: 0,
  },
})

export function WorkbenchSettingsAboutContent(props: {
  workspaceName: string
  enabledPluginCount: number
  tShell?: ShellTranslation
}) {
  return (
    <div {...stylex.attrs(styles.stack)} data-settings-panel-stack>
      <section {...stylex.attrs(styles.panel)}>
        <div {...stylex.attrs(styles.title)}>
          {props.tShell?.("chrome.settings.about.title") ?? "关于 Tabora"}
        </div>
        <div {...stylex.attrs(styles.body)}>
          <p {...stylex.attrs(styles.paragraph)}>
            {props.tShell?.("chrome.settings.about.description") ??
              "当前实现已切换到双布局工作台骨架，设置中心按固定分类组织插件设置内容。"}
          </p>
          <p {...stylex.attrs(styles.paragraph)}>
            {props.tShell
              ? props.tShell("chrome.settings.about.workspaceLabel", { name: props.workspaceName })
              : `当前工作区：${props.workspaceName}。`}
          </p>
          <p {...stylex.attrs(styles.paragraph)}>
            {props.tShell
              ? props.tShell("chrome.settings.about.enabledPluginsLabel", {
                  count: props.enabledPluginCount,
                })
              : `已启用官方插件：${props.enabledPluginCount}。`}
          </p>
        </div>
      </section>
    </div>
  )
}
