import { FieldRow, InlineError } from "@tabora/ui"
import { createSignal, For, Show } from "solid-js"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

export function WorkbenchSettingsPanel(props: SettingsPanelViewProps) {
  const [importError, setImportError] = createSignal<string | null>(null)
  const [importWarnings, setImportWarnings] = createSignal<string[]>([])
  const [importSuccess, setImportSuccess] = createSignal(false)
  const [newWorkspaceName, setNewWorkspaceName] = createSignal("")

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

  return (
    <div class="settings-panel-stack">
      <section class="set-group">
        <div class="set-group-title">工作台布局</div>
        <p class="settings-help">
          布局是插件。当前可用布局来自 layout contribution，Focus 布局用于深度专注工作流。
        </p>
        <div class="set-hint">不同的布局适合不同的使用习惯和工作流程。</div>
      </section>

      <section class="set-group">
        <div class="set-group-title">工作区</div>
        <FieldRow
          label="当前工作区"
          description="存储布局、主题、背景和卡片配置"
          trailing={<span class="settings-row-meta">{props.workspace.name}</span>}
        />
        <Show when={workspaces().length > 1}>
          <div class="workspace-list">
            <For each={workspaces()}>
              {(workspace) => (
                <div class="workspace-list-item">
                  <span
                    class="workspace-list-name"
                    classList={{
                      active: workspace.id === props.workspace.id,
                    }}
                  >
                    {workspace.name}
                    {workspace.id === props.workspace.id ? " · 当前" : ""}
                  </span>
                  <div class="workspace-list-actions">
                    <Show when={workspace.id !== props.workspace.id}>
                      <button
                        type="button"
                        class="settings-mini-btn"
                        onClick={() => void props.host.switchWorkspace?.(workspace.id)}
                      >
                        切换
                      </button>
                    </Show>
                    <Show when={workspace.id !== "default"}>
                      <button
                        type="button"
                        class="settings-mini-btn danger"
                        onClick={() => void props.host.deleteWorkspace?.(workspace.id)}
                      >
                        删除
                      </button>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        <FieldRow
          label="新建工作区"
          description="创建独立的布局、主题和卡片配置"
          trailing={
            <div class="workspace-create-row">
              <input
                id="ws-new-name"
                class="workspace-create-input"
                value={newWorkspaceName()}
                onInput={(event) => setNewWorkspaceName(event.currentTarget.value)}
                onKeyDown={(event) => event.key === "Enter" && void handleCreate()}
                placeholder="新建工作区"
                aria-label="新建工作区名称"
              />
              <button
                type="button"
                class="settings-mini-btn"
                disabled={!newWorkspaceName().trim()}
                onClick={() => void handleCreate()}
              >
                创建
              </button>
            </div>
          }
        />
        <div class="workspace-actions">
          <button type="button" class="settings-mini-btn" onClick={() => void handleExport()}>
            导出
          </button>
          <button type="button" class="settings-mini-btn" onClick={handleImport}>
            导入
          </button>
        </div>
        <Show when={importError()}>
          <InlineError>{importError()!}</InlineError>
        </Show>
        <Show when={importSuccess()}>
          <div class="workspace-import-success">导入成功</div>
        </Show>
        <Show when={importWarnings().length > 0}>
          <ul class="workspace-import-warnings">
            <For each={importWarnings()}>{(warning) => <li>{warning}</li>}</For>
          </ul>
        </Show>
      </section>
    </div>
  )
}
