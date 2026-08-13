import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui/button"
import { FieldRow } from "@tabora/ui/field-row"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Kbd } from "@tabora/ui/kbd"
import { Select } from "@tabora/ui/select"
import { Stepper } from "@tabora/ui/stepper"
import { Switch } from "@tabora/ui/switch"
import { createSignal, For, Show } from "solid-js"
import type { SettingsPanelData, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"
import { contributionRefKey } from "@tabora/plugin-api/sdk"

import { CheckChipList, ContributionSegmented, SettingsGroup } from "./settings-workspace.shared"
import { styles } from "./styles"

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
  const workspace = () =>
    props.data.workspace ?? {
      id: "",
      name: "未授权工作区",
      activeLayout: { pluginId: "", kind: "layout" as const, id: "" },
      activeTheme: { pluginId: "", kind: "theme" as const, id: "" },
      activeBackgroundProvider: {
        pluginId: "",
        kind: "background-provider" as const,
        id: "",
      },
      regionCount: 0,
    }
  const workspaces = () => props.data.workspaces ?? []
  const layouts = () => props.data.layouts ?? []

  async function handleExport() {
    try {
      const json = await props.host.exportWorkspace?.()
      if (!json) return
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `tabora-workspace-${workspace().name}.json`
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

  const workspaceOptions = () => {
    const list = workspaces().length > 0 ? workspaces() : [workspace()]
    return list.map((workspace) => ({ value: workspace.id, label: workspace.name }))
  }
  const layoutOptions = () =>
    layouts().map((layout) => ({
      value: contributionRefKey(layout.ref),
      label: layoutShortLabel(layout),
    }))
  const widgetInstanceCount = () => workspace().regionCount
  return (
    <div {...stylex.attrs(styles.panelStack)} data-settings-panel="workbench">
      <SettingsGroup title="工作区" meta="本地保存">
        <FieldRow
          label="当前工作区"
          description={`${workspace().name} · 保存布局、卡片和背景配置`}
          trailing={
            <Select<string>
              size="sm"
              value={workspace().id}
              options={workspaceOptions()}
              disabled={workspaces().length <= 1 || !props.host.switchWorkspace}
              onChange={(workspaceId) => void props.host.switchWorkspace?.(workspaceId)}
              aria-label="当前工作区"
            />
          }
        />
        <FieldRow
          label="默认布局"
          description="切换新标签页打开时使用的布局插件"
          trailing={
            <ContributionSegmented
              ariaLabel="默认布局"
              activeKey={contributionRefKey(workspace().activeLayout)}
              fallback={workspace().activeLayout.id}
              items={layouts}
              options={layoutOptions}
              onPick={(layout) => void props.host.switchLayout?.(layout.ref)}
            />
          }
        />
        <FieldRow
          label="默认卡片列数"
          description="Dashboard 首次打开时使用的网格密度"
          trailing={
            <Stepper
              value={defaultColumns()}
              min={3}
              max={6}
              onChange={setDefaultColumns}
              aria-label="默认卡片列数"
              decrementAriaLabel="减少默认卡片列数"
              incrementAriaLabel="增加默认卡片列数"
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="启动行为" meta="快捷入口">
        <FieldRow
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
          label="全局命令快捷键"
          description="从任意输入状态唤起命令搜索"
          trailing={
            <span {...stylex.attrs(styles.keybind)} aria-label="全局命令快捷键">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          }
        />
        <FieldRow
          label="启动后恢复"
          description="选择刷新后要自动恢复的个人状态"
          trailing={
            <CheckChipList
              ariaLabel="启动后恢复"
              items={() => [
                { label: "布局", checked: restoreLayout(), onChange: setRestoreLayout },
                { label: "尺寸", checked: restoreSize(), onChange: setRestoreSize },
                { label: "筛选", checked: restoreFilter(), onChange: setRestoreFilter },
              ]}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup title="工作区管理" meta="导入导出">
        <FieldRow
          label="新建工作区"
          description="创建独立的布局、主题和卡片配置"
          trailing={
            <div {...stylex.attrs(styles.wideInlineActions)}>
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
          label="卡片状态"
          description="按实例保存卡片排序、尺寸和所在区域"
          trailing={<span {...stylex.attrs(styles.rowMeta)}>{widgetInstanceCount()} 个实例</span>}
        />
        <FieldRow
          label="备份与恢复"
          description="导出当前工作区 JSON，或从本地文件导入"
          trailing={
            <div {...stylex.attrs(styles.inlineActions)}>
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
          <div {...stylex.attrs(styles.list)}>
            <For each={workspaces()}>
              {(workspaceItem) => (
                <div {...stylex.attrs(styles.listItem)}>
                  <span
                    {...stylex.attrs(
                      styles.listName,
                      workspaceItem.id === workspace().id && styles.listNameActive,
                    )}
                  >
                    {workspaceItem.name}
                    {workspaceItem.id === workspace().id ? " · 当前" : ""}
                  </span>
                  <div {...stylex.attrs(styles.inlineActions)}>
                    <Show when={workspaceItem.id !== workspace().id}>
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => void props.host.switchWorkspace?.(workspaceItem.id)}
                      >
                        切换
                      </Button>
                    </Show>
                    <Show when={workspaceItem.id !== "default"}>
                      <Button
                        size="sm"
                        variant="danger-subtle"
                        onClick={() => void props.host.deleteWorkspace?.(workspaceItem.id)}
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
          <div {...stylex.attrs(styles.successText)}>导入成功</div>
        </Show>
        <Show when={importWarnings().length > 0}>
          <ul {...stylex.attrs(styles.warningList)}>
            <For each={importWarnings()}>{(warning) => <li>{warning}</li>}</For>
          </ul>
        </Show>
      </SettingsGroup>
    </div>
  )
}

function layoutShortLabel(layout: NonNullable<SettingsPanelData["layouts"]>[number]) {
  const key = `${layout.id} ${layout.title}`.toLowerCase()
  if (key.includes("dashboard") || key.includes("仪表盘")) return "Dashboard"
  if (key.includes("stream") || key.includes("focus") || key.includes("专注")) return "Stream"
  if (key.includes("masonry") || key.includes("diy") || key.includes("瀑布")) return "DIY"
  return layout.title
}
