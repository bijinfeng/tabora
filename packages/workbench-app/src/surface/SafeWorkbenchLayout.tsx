import * as stylex from "@stylexjs/stylex"
import { TaboraMark } from "@tabora/brand"
import type { PluginInstance, WidgetViewProps, WidgetSize } from "@tabora/plugin-api"
import { PluginViewBoundary, WidgetCardShell } from "@tabora/workbench-shell"
import { Moon, Sun } from "lucide-solid"
import { Button } from "@tabora/ui"
import { For } from "solid-js"
import type { JSX } from "solid-js"

import type {
  ShellTranslation,
  WorkbenchShellPluginViewBoundaryCopy,
  WorkbenchShellWidgetCopy,
} from "../i18n"
import { color, font, radius, space } from "@tabora/theme/tokens.stylex"
import type { SafeLayoutModel, SolidView } from "./WorkbenchShellChrome.types"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
    minHeight: "100vh",
    padding: space.s6,
    "@media (max-width: 480px)": {
      padding: space.s5,
    },
  },
  toolbar: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    gap: space.s2,
    minHeight: 44,
    paddingInline: space.s4,
  },
  logo: {
    alignItems: "center",
    display: "inline-flex",
    fontSize: 15,
    fontWeight: font.bold,
    gap: space.s3,
  },
  logoMark: {
    color: color.accent,
    flexShrink: 0,
    height: 20,
    width: 20,
  },
  spacer: {
    flex: 1,
  },
  button: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.control,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 11,
    gap: 4,
    height: 28,
    justifyContent: "center",
    paddingInline: 10,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  list: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(16, minmax(0, 1fr))",
    minWidth: 0,
    "@media (max-width: 1024px)": {
      gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
    },
    "@media (max-width: 768px)": {
      gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
  },
  empty: {
    color: color.textMuted,
    fontSize: 13,
    padding: 20,
    textAlign: "center",
  },
})

export function SafeWorkbenchLayout(props: {
  isDark: boolean
  instances: PluginInstance[]
  tShell?: ShellTranslation
  widgetContribution: (
    instance: Pick<PluginInstance, "pluginId" | "contributionId">,
  ) => { icon?: string; views: { card: string } } | null | undefined
  resolveWidgetModel: (instance: PluginInstance) => SafeLayoutModel | null
  getView: (viewId: string) => SolidView<WidgetViewProps> | undefined
  renderWidgetIcon: (icon?: string) => JSX.Element
  buildWidgetViewProps: (instance: PluginInstance, model: SafeLayoutModel) => WidgetViewProps
  onOpenCommandPalette: () => void
  onToggleTheme: () => void
  onOpenSettings: () => void
  onOpenExpand: (instance: PluginInstance) => void
  onOpenContextMenu: (event: MouseEvent, instanceId: string) => void
  onResize: (instanceId: string, size: WidgetSize) => void
  onRemove: (instanceId: string) => void
  isDragging: (instanceId: string) => boolean
  widgetShellCopy?: WorkbenchShellWidgetCopy
  pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
}) {
  return (
    <div {...stylex.attrs(styles.root)} data-safe-workbench-layout>
      <div {...stylex.attrs(styles.toolbar)}>
        <span {...stylex.attrs(styles.logo)}>
          <TaboraMark class={stylex.attrs(styles.logoMark).class} />
          <span>Tabora</span>
        </span>
        <div {...stylex.attrs(styles.spacer)} />
        <Button xstyle={styles.button} onClick={props.onOpenCommandPalette}>
          {props.tShell?.("chrome.toolbar.search") ?? "搜索"}
        </Button>
        <Button
          xstyle={styles.button}
          aria-label={
            props.isDark
              ? (props.tShell?.("chrome.toolbar.toggleThemeToLight") ?? "切换到明亮主题")
              : (props.tShell?.("chrome.toolbar.toggleThemeToDark") ?? "切换到暗色主题")
          }
          onClick={props.onToggleTheme}
        >
          {props.isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <Button xstyle={styles.button} onClick={props.onOpenSettings}>
          {props.tShell?.("chrome.toolbar.settings") ?? "设置"}
        </Button>
      </div>
      <div {...stylex.attrs(styles.list)}>
        <For each={props.instances}>
          {(instance) => {
            const widget = props.widgetContribution(instance)
            const model = props.resolveWidgetModel(instance)
            if (!model) {
              return (
                <div {...stylex.attrs(styles.empty)}>
                  {props.tShell
                    ? props.tShell("placeholders.widgetInstanceInvalid", {
                        instanceId: instance.id,
                      })
                    : `卡片实例无效：${instance.id}`}
                </div>
              )
            }
            const viewId = widget?.views.card
            const View = viewId ? props.getView(viewId) : undefined
            if (!View) return null

            return (
              <WidgetCardShell
                instance={instance}
                title={model.title}
                icon={props.renderWidgetIcon(model.icon)}
                supportedSizes={model.supportedSizes}
                currentSize={model.currentSize}
                {...(props.widgetShellCopy ? { copy: props.widgetShellCopy } : {})}
                callbacks={{
                  onDblClick: () => props.onOpenExpand(instance),
                  onContextMenu: (event: MouseEvent) => props.onOpenContextMenu(event, instance.id),
                  onResize: (size: WidgetSize) => props.onResize(instance.id, size),
                  onRemove: () => props.onRemove(instance.id),
                  onExpand: () => props.onOpenExpand(instance),
                  isDragging: props.isDragging(instance.id),
                }}
              >
                <PluginViewBoundary
                  instanceId={instance.id}
                  title={model.title}
                  {...(props.pluginViewBoundaryCopy ? { copy: props.pluginViewBoundaryCopy } : {})}
                >
                  <div data-tabora-plugin-id={instance.pluginId}>
                    {View(props.buildWidgetViewProps(instance, model))}
                  </div>
                </PluginViewBoundary>
              </WidgetCardShell>
            )
          }}
        </For>
      </div>
    </div>
  )
}
