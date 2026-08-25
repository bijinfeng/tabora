# Phase 4B 实施计划：Background Renderer 挂载

## 目标

实现 background renderer 的完整挂载流程，使插件能够通过自定义渲染器控制背景显示。

**范围**：

- ✅ catalog `listBackgroundRenderers` 方法（已完成）
- WorkbenchShellApp 背景层渲染
- CSS renderer 实现（替换空 `return null`）
- 切换 API（workspace controller）

**不包含**：

- 动态授权流程（Phase 4C）
- Image/Video/Canvas renderer 实现（可选扩展）

---

## 当前状态分析

### 已有基础设施

1. **Manifest 协议** ✅
   - `BackgroundRendererContribution` 类型定义
   - `workspace.activeBackgroundRenderer?: BackgroundRendererContributionRef`
   - manifestSchema 验证完整

2. **Plugin Catalog** ✅
   - `listBackgroundRenderers()` 已实现（刚添加）
   - `resolveContribution()` 已支持 "background-renderer" case

3. **Background Provider 系统** ✅
   - `applyBackgroundStyle()` 应用 CSS 样式
   - `resolveBackgroundValue()` 解析 provider 值
   - WorkbenchShellApp 已有背景应用逻辑

4. **官方插件** ✅
   - `official.background.basic` 声明了 CSS renderer
   - 当前实现为空（`return null`）

### 缺失部分

1. **背景层渲染器挂载**
   - WorkbenchShellApp 中没有渲染 background renderer 视图的位置
   - 需要决定渲染器放置的层级（body 背景层？layout 内部？）

2. **Renderer 实现**
   - CSS renderer 当前为空实现
   - 需要接收 provider 的 resolved value 并应用样式

3. **切换 API**
   - Workspace controller 需要 `updateBackgroundRenderer` 方法
   - Settings 面板需要能选择 renderer（可能已有？）

---

## 设计决策

### 1. Renderer 放置位置

**选项 A**：body 级别（与当前 applyBackgroundStyle 平级）

- 优点：与现有背景系统对齐，简单
- 缺点：renderer 无法访问 Solid 上下文

**选项 B**：WorkbenchShellApp root 内的固定背景层

- 优点：可以是完整的 Solid 组件，支持复杂渲染
- 缺点：需要新增渲染层结构

**推荐**：选项 B - 在 WorkbenchShellSurfaceHost 之前添加背景层容器

### 2. CSS Renderer 行为

CSS renderer 应该：

- 接收 `ResolvedBackgroundValue`（from provider）
- 使用 `applyBackgroundStyle()` 应用到目标元素
- 返回 null（无 UI，纯副作用）

### 3. Renderer 生命周期

- Renderer 视图在 `workspace.activeBackgroundRenderer` 存在时挂载
- 切换 renderer 时卸载旧视图，挂载新视图
- Provider 切换时，renderer 收到新的 resolved value

---

## 实施步骤

### Step 1: 实现 CSS Renderer

**文件**: `packages/official-plugins/src/background-basic.ts`

```typescript
import { createEffect, onCleanup } from "solid-js"
import type { BackgroundRendererViewProps } from "@tabora/plugin-api"

export function BackgroundRenderer(props: BackgroundRendererViewProps) {
  createEffect(() => {
    const value = props.resolvedValue
    if (!value) return

    const style =
      value.type === "css" ? value.css : value.type === "gradient" ? { background: value.css } : {}

    // Apply to body
    for (const [prop, val] of Object.entries(style)) {
      document.body.style.setProperty(prop, val)
    }

    onCleanup(() => {
      // Clean up when unmounted
      for (const prop of Object.keys(style)) {
        document.body.style.removeProperty(prop)
      }
    })
  })

  return null
}
```

### Step 2: 定义 BackgroundRendererViewProps

**文件**: `packages/plugin-api/src/manifest.ts`

```typescript
export type BackgroundRendererViewProps = {
  rendererId: string
  pluginId: string
  resolvedValue: ResolvedBackgroundValue | null
}
```

### Step 3: 在 WorkbenchShellApp 添加背景层渲染

**位置**: `WorkbenchShellSurfaceHost` 之前

```typescript
// 在 WorkbenchShellProvider 内部，surface host 之前
<Show when={shell.workspace.activeBackgroundRenderer}>
  {(rendererRef) => {
    const resolvedValue = () => {
      const provider = shell.workspace.activeBackgroundProvider
      return resolveBackgroundValue(provider.id, backgrounds)
    }

    return (
      <PluginViewBoundary /* ... */>
        {(Component) => (
          <Component
            rendererId={rendererRef().id}
            pluginId={rendererRef().pluginId}
            resolvedValue={resolvedValue()}
          />
        )}
      </PluginViewBoundary>
    )
  }}
</Show>
```

### Step 4: 添加 updateBackgroundRenderer API

**文件**: `packages/workbench-app/src/workspace/workspaceSession.ts`

```typescript
export async function updateWorkspaceBackgroundRenderer(
  workspaceId: string,
  rendererId: string | null,
  options: {
    repository: WorkspaceRepository
    catalog: PluginCatalog
  },
): Promise<Workspace> {
  const workspace = await options.repository.getById(workspaceId)
  if (!workspace) throw new Error(`Workspace ${workspaceId} not found`)

  const renderer = rendererId
    ? options.catalog.resolveContribution({
        pluginId: rendererId.split(".")[0], // 简化，实际需要完整 ref
        kind: "background-renderer",
        id: rendererId,
      })
    : null

  const updated = {
    ...workspace,
    activeBackgroundRenderer: renderer?.ref ?? undefined,
    updatedAt: new Date().toISOString(),
  }

  await options.repository.update(updated)
  return updated
}
```

### Step 5: 连接到 workspace controller

**文件**: `packages/workbench-app/src/workspace/WorkbenchShellWorkspaceController.ts`

在 `createWorkbenchWorkspaceController` 返回对象中添加：

```typescript
updateBackgroundRenderer: async (rendererId: string | null) => {
  const updated = await updateWorkspaceBackgroundRenderer(getWorkspace().id, rendererId, {
    repository: options.repository,
    catalog: options.pluginCatalog,
  })
  setWorkspace(updated)
}
```

### Step 6: Settings 面板集成

检查 `packages/official-plugins/src/settings-workspace.appearance.tsx` 是否已有 renderer 选择器。
如果没有，添加类似 background provider 的选择逻辑。

### Step 7: 测试

1. 单元测试：
   - `listBackgroundRenderers` 返回正确列表
   - `updateBackgroundRenderer` 更新 workspace
   - CSS renderer 应用样式

2. 集成测试：
   - 切换 renderer 触发视图更新
   - Provider 切换时 renderer 收到新 resolved value

3. 手动测试：
   - 在 settings 中选择 CSS renderer
   - 切换 background provider，确认样式正确应用

---

## 风险评估

### 低风险

- CSS renderer 实现（纯副作用，无复杂逻辑）
- listBackgroundRenderers（已完成并测试）

### 中风险

- WorkbenchShellApp 背景层挂载（需要确保不破坏现有布局）
- Renderer 视图生命周期管理

### 缓解措施

- 渐进式实施：先实现 renderer view，再连接切换 API
- 保持向后兼容：activeBackgroundRenderer 为空时使用原有逻辑
- 充分测试：确保 renderer 卸载时清理副作用

---

## 预计工作量

- Step 1-2: 1 小时（实现 CSS renderer + 类型定义）
- Step 3: 1.5 小时（背景层挂载 + 视图边界）
- Step 4-5: 1 小时（切换 API）
- Step 6: 0.5 小时（Settings 集成检查）
- Step 7: 1 小时（测试）
- **总计**: 5 小时

---

## 成功标准

- ✅ `listBackgroundRenderers()` 返回正确的 renderer 列表
- ✅ CSS renderer 能够应用 provider 提供的样式
- ✅ Workspace 可以持久化 activeBackgroundRenderer
- ✅ 切换 renderer 触发视图更新
- ✅ 所有现有测试继续通过
- ✅ 类型检查无错误
