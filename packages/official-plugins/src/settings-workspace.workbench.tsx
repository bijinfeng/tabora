import {
  Button,
  Checkbox,
  FieldRow,
  InlineError,
  Input,
  Kbd,
  SegmentedControl,
  Select,
  Switch,
} from "@tabora/ui"
import { createSignal, For, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { className, styles, sx } from "./styles"

export function WorkbenchSettingsPanel(props: SettingsPanelViewProps) {
  const [importError, setImportError] = createSignal<string | null>(null)
  const [importWarnings, setImportWarnings] = createSignal<string[]>([])
  const [importSuccess, setImportSuccess] = createSignal(false)
  const [newWorkspaceName, setNewWorkspaceName] = createSignal("")
  const [defaultColumns, setDefaultColumns] = createSignal(4)
  const [focusSearchOnOpen, setFocusSearchOnOpen] = createSignal(true)
  const [restoreCardSize, setRestoreCardSize] = createSignal(true)
  const [restoreLayout, setRestoreLayout] = createSignal(true)
  const [restoreSize, setRestoreSize] = createSignal(true)
  const [restoreFilter, setRestoreFilter] = createSignal(false)

  async function handleExport() {
    try {
      const json = await props.host.exportWorkspace?.()
      if (!json) return
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `tabora-workspace-${props.workspace.name}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "导出失败")
    }
  }

  async function handleImport() {
    setImportError(null)
    setImportWarnings([])
    setImportSuccess(false)
    try {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return
        try {
          const text = await file.text()
          const result = await props.host.importWorkspace?.(text)
          if (!result) return
          setImportWarnings(result.warnings)
          setImportSuccess(true)
        } catch (err: unknown) {
          setImportError(err instanceof Error ? err.message : "导入失败")
        }
      }
      input.click()
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "导入操作失败")
    }
  }

  async function handleCreate() {
    const name = newWorkspaceName().trim()
    if (!name) return
    await props.host.createWorkspace?.(name)
    setNewWorkspaceName("")
  }

  const workspaces = () => props.workspaces ?? []
  const workspaceOptions = () => {
    const list = workspaces().length > 0 ? workspaces() : [props.workspace]
    return list.map((workspace) => ({ value: workspace.id, label: workspace.name }))
  }
  const layoutOptions = () =>
    props.layouts.map((layout) => ({ value: layout.id, label: layoutShortLabel(layout) }))
  const widgetInstanceCount = () =>
    Object.values(props.workspace.regions).reduce(
      (total, region) => total + region.instances.length,
      0,
    )
  const stepColumns = (delta: number) =>
    setDefaultColumns((value) => Math.min(6, Math.max(3, value + delta)))

  return (
    <div {...sx(styles.panelStack)} data-settings-panel="workbench">
      <section {...sx(styles.group)}>
        <div {...sx(styles.groupTitle)}>
          工作区<span {...sx(styles.groupTitleMeta)}>本地保存</span>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="当前工作区"
          description={`${props.workspace.name} · 保存布局、卡片和背景配置`}
          trailing={
            <Select<string>
              size="sm"
              value={props.workspace.id}
              options={workspaceOptions()}
              disabled={workspaces().length <= 1 || !props.host.switchWorkspace}
              onChange={(workspaceId) => void props.host.switchWorkspace?.(workspaceId)}
              aria-label="当前工作区"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="默认布局"
          description="切换新标签页打开时使用的布局插件"
          trailing={
            <Show
              when={layoutOptions().length > 0}
              fallback={<span {...sx(styles.rowMeta)}>{props.workspace.activeLayoutId}</span>}
            >
              <SegmentedControl<string>
                size="sm"
                value={props.workspace.activeLayoutId}
                options={layoutOptions()}
                onChange={(layoutId) => void props.host.switchLayout?.(layoutId)}
                aria-label="默认布局"
              />
            </Show>
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="默认卡片列数"
          description="Dashboard 首次打开时使用的网格密度"
          trailing={
            <div {...sx(styles.stepper)} aria-label="默认卡片列数">
              <Button
                size="sm"
                variant="ghost"
                aria-label="减少默认卡片列数"
                onClick={() => stepColumns(-1)}
              >
                -
              </Button>
              <strong>{defaultColumns()}</strong>
              <Button
                size="sm"
                variant="ghost"
                aria-label="增加默认卡片列数"
                onClick={() => stepColumns(1)}
              >
                +
              </Button>
            </div>
          }
        />
      </section>

      <section {...sx(styles.group)}>
        <div {...sx(styles.groupTitle)}>
          启动行为<span {...sx(styles.groupTitleMeta)}>快捷入口</span>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="打开时聚焦搜索"
          description="新标签页加载后自动把焦点放到命令搜索框"
          trailing={
            <Switch
              size="sm"
              checked={focusSearchOnOpen()}
              onChange={setFocusSearchOnOpen}
              aria-label="打开时聚焦搜索"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="保留上次卡片尺寸"
          description="刷新后恢复每张卡片的 S / M / L 状态"
          trailing={
            <Switch
              size="sm"
              checked={restoreCardSize()}
              onChange={setRestoreCardSize}
              aria-label="保留上次卡片尺寸"
            />
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="全局命令快捷键"
          description="从任意输入状态唤起命令搜索"
          trailing={
            <span {...sx(styles.keybind)} aria-label="全局命令快捷键">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="启动后恢复"
          description="选择刷新后要自动恢复的个人状态"
          trailing={
            <div {...sx(styles.checkList)} aria-label="启动后恢复">
              <span {...sx(styles.checkChip)}>
                <Checkbox checked={restoreLayout()} onChange={setRestoreLayout} label="布局" />
              </span>
              <span {...sx(styles.checkChip)}>
                <Checkbox checked={restoreSize()} onChange={setRestoreSize} label="尺寸" />
              </span>
              <span {...sx(styles.checkChip)}>
                <Checkbox checked={restoreFilter()} onChange={setRestoreFilter} label="筛选" />
              </span>
            </div>
          }
        />
      </section>

      <section {...sx(styles.group)}>
        <div {...sx(styles.groupTitle)}>
          工作区管理<span {...sx(styles.groupTitleMeta)}>导入导出</span>
        </div>
        <FieldRow
          class={className(styles.fieldRow)}
          label="新建工作区"
          description="创建独立的布局、主题和卡片配置"
          trailing={
            <div {...sx(styles.wideInlineActions)}>
              <Input
                size="sm"
                id="ws-new-name"
                value={newWorkspaceName()}
                onInput={(value: string) => setNewWorkspaceName(value)}
                onKeyDown={(event: KeyboardEvent) => event.key === "Enter" && void handleCreate()}
                placeholder="新建工作区"
                aria-label="新建工作区名称"
              />
              <Button
                size="sm"
                variant="subtle"
                disabled={!newWorkspaceName().trim()}
                onClick={() => void handleCreate()}
              >
                创建
              </Button>
            </div>
          }
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="卡片状态"
          description="按实例保存卡片排序、尺寸和所在区域"
          trailing={<span {...sx(styles.rowMeta)}>{widgetInstanceCount()} 个实例</span>}
        />
        <FieldRow
          class={className(styles.fieldRow)}
          label="备份与恢复"
          description="导出当前工作区 JSON，或从本地文件导入"
          trailing={
            <div {...sx(styles.inlineActions)}>
              <Button size="sm" variant="secondary" onClick={() => void handleExport()}>
                导出
              </Button>
              <Button size="sm" variant="secondary" onClick={handleImport}>
                导入
              </Button>
            </div>
          }
        />
        <Show when={workspaces().length > 1}>
          <div {...sx(styles.list)}>
            <For each={workspaces()}>
              {(workspace) => (
                <div {...sx(styles.listItem)}>
                  <span
                    {...sx(
                      styles.listName,
                      workspace.id === props.workspace.id && styles.listNameActive,
                    )}
                  >
                    {workspace.name}
                    {workspace.id === props.workspace.id ? " · 当前" : ""}
                  </span>
                  <div {...sx(styles.inlineActions)}>
                    <Show when={workspace.id !== props.workspace.id}>
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => void props.host.switchWorkspace?.(workspace.id)}
                      >
                        切换
                      </Button>
                    </Show>
                    <Show when={workspace.id !== "default"}>
                      <Button
                        size="sm"
                        variant="danger-subtle"
                        onClick={() => void props.host.deleteWorkspace?.(workspace.id)}
                      >
                        删除
                      </Button>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={importError()}>
          <InlineError>{importError()!}</InlineError>
        </Show>
        <Show when={importSuccess()}>
          <div {...sx(styles.successText)}>导入成功</div>
        </Show>
        <Show when={importWarnings().length > 0}>
          <ul {...sx(styles.warningList)}>
            <For each={importWarnings()}>{(warning) => <li>{warning}</li>}</For>
          </ul>
        </Show>
      </section>
    </div>
  )
}

function layoutShortLabel(layout: SettingsPanelViewProps["layouts"][number]) {
  const key = `${layout.id} ${layout.title}`.toLowerCase()
  if (key.includes("dashboard") || key.includes("仪表盘")) return "Dashboard"
  if (key.includes("stream") || key.includes("focus") || key.includes("专注")) return "Stream"
  if (key.includes("masonry") || key.includes("diy") || key.includes("瀑布")) return "DIY"
  return layout.title
}
