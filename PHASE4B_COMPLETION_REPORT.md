# Phase 4B 完成报告：Background Renderer 挂载

## 概述

成功实现 background renderer 的完整挂载流程，使插件能够通过自定义渲染器控制背景显示。

**净新增代码**: 约 150 行（生产代码 ~100 行 + 文档 ~50 行）

## 完成的工作

### Step 1: 实现 CSS Renderer ✅

**文件**: `packages/official-plugins/src/background-basic.ts`

- 将空实现 `return null` 替换为功能完整的 CSS 渲染器
- 使用 `createEffect` 监听 `resolvedValue` 变化
- 支持 `css` 和 `gradient` 类型的背景值
- 应用样式到 `document.body`
- 实现 cleanup 逻辑，卸载时移除应用的样式

**核心逻辑**:

```typescript
export function CSSBackgroundRenderer(props: BackgroundRendererViewProps) {
  createEffect(() => {
    const value = props.resolvedValue
    let style: Record<string, string>

    if (!value) {
      style = props.fallbackStyle
    } else if (value.type === "css") {
      style = value.css
    } else if (value.type === "gradient") {
      style = { background: value.css }
    } else {
      style = props.fallbackStyle
    }

    // 应用到 body
    for (const [prop, val] of Object.entries(style)) {
      document.body.style.setProperty(prop, val)
    }

    onCleanup(() => {
      for (const prop of Object.keys(style)) {
        document.body.style.removeProperty(prop)
      }
    })
  })

  return null
}
```

### Step 2: Catalog 实现 listBackgroundRenderers ✅

**文件**: `packages/orchestrator/src/plugin-catalog.ts`

- 添加 `listBackgroundRenderers()` 方法
- 返回所有活动插件的 background renderer contributions
- 导出 `BackgroundRendererContributionDescriptor` 类型

**实现**:

```typescript
function listBackgroundRenderers(): BackgroundRendererContributionDescriptor[] {
  return activePlugins().flatMap((plugin) =>
    (plugin.manifest.contributes.backgroundRenderers ?? []).map((renderer) => ({
      ...renderer,
      ref: {
        pluginId: plugin.manifest.id,
        kind: "background-renderer" as const,
        id: renderer.id,
      },
    })),
  )
}
```

### Step 3: WorkbenchShellApp 背景层渲染 ✅

**文件**: `packages/workbench-app/src/shell/WorkbenchShellApp.tsx`

- 在 `<WorkbenchShellSurfaceHost />` 之前添加背景渲染器层
- 使用 `<Show when={workspace.activeBackgroundRenderer}>` 条件渲染
- 解析 background provider 的 resolved value
- 从 view registry 获取渲染器组件
- 传递正确的 props (`BackgroundRendererViewProps`)

**实现**:

```tsx
<Show when={shell.state.workspace.workspaceState()?.activeBackgroundRenderer}>
  {(rendererRef) => {
    const workspace = shell.state.workspace.workspaceState()
    if (!workspace) return null

    const backgrounds = pluginCatalog.listBackgroundProviders()
    const value = resolveBackgroundValue(
      workspace.activeBackgroundProvider.id,
      backgrounds,
    )
    const fallbackStyle = resolveBackgroundStyle(
      workspace.activeBackgroundProvider.id,
      backgrounds,
    )

    const viewId = rendererRef().pluginId + "." + rendererRef().id
    const Component = kernel.registry.views.get(viewId) as unknown as (
      props: BackgroundRendererViewProps,
    ) => JSX.Element
    if (!Component) return null

    return (
      <Component
        providerId={workspace.activeBackgroundProvider.id}
        providerTitle={...}
        sourceType={...}
        resolvedValue={value}
        fallbackStyle={fallbackStyle}
      />
    )
  }}
</Show>
```

### Step 4: 添加切换 API ✅

**文件**: `packages/workbench-app/src/workspace/workspaceSession.ts`

- 新增 `updateWorkspaceBackgroundRenderer()` 函数
- 支持设置 renderer 或清除 renderer（设为 null）
- 使用 `delete` 操作符确保类型安全（`exactOptionalPropertyTypes: true`）

**实现**:

```typescript
export async function updateWorkspaceBackgroundRenderer(options: {
  workspaceRepo: WorkspaceRepository
  workspaceId: string
  renderer: BackgroundRendererContributionRef | null
}): Promise<Workspace | null> {
  return updateWorkspaceRecord({
    workspaceRepo: options.workspaceRepo,
    workspaceId: options.workspaceId,
    mutator(workspace) {
      if (options.renderer === null) {
        delete workspace.activeBackgroundRenderer
      } else {
        workspace.activeBackgroundRenderer = options.renderer
      }
      return workspace
    },
  })
}
```

### Step 5: Workspace Controller 集成 ✅

**文件**: `packages/workbench-app/src/workspace/WorkbenchShellWorkspaceController.ts`

- 添加 `switchBackgroundRenderer()` 方法
- 调用 `updateWorkspaceBackgroundRenderer()` 持久化更改
- 更新 workspace state 触发 UI 刷新

**实现**:

```typescript
async function switchBackgroundRenderer(renderer: BackgroundRendererContributionRef | null) {
  const workspace = requireWorkspace(options.getWorkspaceState())
  const updated = await updateWorkspaceBackgroundRenderer({
    workspaceRepo: options.workspaceRepo,
    workspaceId: workspace.id,
    renderer,
  })
  if (updated) {
    options.setWorkspaceState(updated)
  }
}
```

## 验证结果

### 类型检查 ✅

```
Found 0 errors and 1 warning in 924 files
```

### 测试 ✅

```
Test Files  165 passed (165)
Tests       822 passed (822)
Duration    40.12s
```

### 构建 ✅

```
Build complete
- packages 编译成功
- fnos frontend/backend 构建成功
```

### 插件边界检查 ✅

修复了 `background-basic.ts` 中的导入路径问题：

- 从 `@tabora/plugin-api` 改为 `@tabora/plugin-api/sdk`
- 确保插件代码只使用面向作者的 SDK API

## 架构改进

### 背景渲染流程

**之前**：

- 背景样式直接通过 `applyBackgroundStyle()` 应用到 body
- 没有插件扩展点

**现在**：

- 支持插件注册自定义 background renderer
- Renderer 接收 resolved value 并自行决定如何渲染
- CSS renderer 保持与原有逻辑的兼容性
- 为未来的 Image/Video/Canvas renderer 留下扩展空间

### 数据流

```
Workspace.activeBackgroundRenderer
  ↓
WorkbenchShellApp 条件渲染
  ↓
从 ViewRegistry 获取组件
  ↓
传递 BackgroundRendererViewProps
  ↓
Renderer 组件 (CSSBackgroundRenderer)
  ↓
应用样式到 document.body
```

### 切换流程

```
Settings UI (未来)
  ↓
workspaceController.switchBackgroundRenderer(ref)
  ↓
updateWorkspaceBackgroundRenderer(workspaceId, ref)
  ↓
更新 workspace.activeBackgroundRenderer
  ↓
触发 WorkbenchShellApp 重新渲染
  ↓
挂载新的 renderer 组件
```

## 修改的文件清单

### 新增文件 (1)

- `.zcode/plans/phase4b-background-renderer.md` (实施计划)

### 修改文件 (5)

**orchestrator 层 (2)**

- `packages/orchestrator/src/plugin-catalog.ts` - 添加 `listBackgroundRenderers()`
- `packages/orchestrator/src/index.ts` - 导出 `BackgroundRendererContributionDescriptor`

**workbench-app 层 (2)**

- `packages/workbench-app/src/shell/WorkbenchShellApp.tsx` - 添加背景渲染器层
- `packages/workbench-app/src/workspace/workspaceSession.ts` - 添加 `updateWorkspaceBackgroundRenderer()`
- `packages/workbench-app/src/workspace/WorkbenchShellWorkspaceController.ts` - 添加 `switchBackgroundRenderer()`

**官方插件 (1)**

- `packages/official-plugins/src/background-basic.ts` - 实现 CSS renderer

## 技术亮点

### 1. 类型安全的可选字段处理

使用 `delete` 操作符而不是赋值 `undefined`，确保与 `exactOptionalPropertyTypes: true` 兼容：

```typescript
if (options.renderer === null) {
  delete workspace.activeBackgroundRenderer // ✅ 正确
} else {
  workspace.activeBackgroundRenderer = options.renderer
}

// ❌ 错误：会导致 TS2412 错误
workspace.activeBackgroundRenderer = options.renderer ?? undefined
```

### 2. 响应式样式应用

使用 Solid 的 `createEffect` 和 `onCleanup` 确保：

- Props 变化时自动更新样式
- 组件卸载时清理样式
- 无内存泄漏

### 3. 向后兼容

- `activeBackgroundRenderer` 是可选字段，未设置时不渲染 renderer
- 现有代码继续使用 `applyBackgroundStyle()`
- CSS renderer 行为与原有逻辑完全一致

### 4. 扩展性设计

Renderer 接口支持未来扩展：

- `accepts: ["css", "image", "video", "gradient", "canvas"]`
- Image renderer 可以渲染 `<img>` 元素
- Video renderer 可以渲染 `<video>` 元素
- Canvas renderer 可以运行自定义绘制逻辑

## 已知限制

### 1. Settings UI 未实现

当前没有 UI 来切换 background renderer。用户需要：

- 手动调用 `workspaceController.switchBackgroundRenderer(ref)`
- 或通过 Settings 面板（需要在 Phase 4C 或后续工作中实现）

### 2. 只有 CSS Renderer

当前只实现了 CSS renderer。Image/Video/Canvas renderer 需要后续工作。

### 3. Renderer 错误处理

如果 renderer 组件抛出错误，当前没有 fallback 机制。建议未来添加：

- PluginViewBoundary 包裹 renderer
- 错误时回退到 `applyBackgroundStyle()`

## 后续工作建议

### Phase 4C: 动态授权流程

- EventBus `permission.request` 事件
- PluginKernel 运行时 grant API + 热更新
- RuntimeContext 异步授权挂起
- Workbench shell 授权弹窗组件
- Settings AI panel 真实实现

### 可选扩展

1. **Settings UI for Renderer Selection**
   - 在 `settings-workspace.appearance.tsx` 添加 renderer 选择器
   - 类似 background provider 的 UI

2. **Image/Video Renderer**
   - 创建 `official.background.media` 插件
   - 实现图片和视频背景渲染器

3. **Canvas Renderer**
   - 支持动态生成的背景（如粒子效果、动画）
   - 需要定义 Canvas API 契约

4. **错误处理增强**
   - 添加 PluginViewBoundary
   - Renderer 错误时显示 toast 通知
   - 自动回退到安全的 CSS 背景

## 风险评估

### 已验证的低风险项 ✅

- CSS renderer 实现（纯副作用，逻辑简单）
- `listBackgroundRenderers()` 方法（遵循现有模式）
- 切换 API（与现有 theme/background 切换一致）
- 所有测试通过（822 个测试）

### 中风险项（已缓解）

- WorkbenchShellApp 背景层挂载
  - **缓解**：使用条件渲染，不破坏现有布局
  - **缓解**：向后兼容，未设置时不渲染

- 类型安全的可选字段
  - **缓解**：使用 `delete` 操作符确保类型正确
  - **缓解**：所有类型检查通过

### 回滚方案

- 单个或一组紧密相关的 commits
- Git revert 即可完全回滚
- 无 schema migration，无数据丢失风险
- `activeBackgroundRenderer` 可选字段，删除后无影响

## 结论

Phase 4B 目标**全部完成**。Background renderer 系统成功实现，包括：

- ✅ Catalog API (`listBackgroundRenderers`)
- ✅ CSS Renderer 实现
- ✅ WorkbenchShellApp 背景层渲染
- ✅ 切换 API (`switchBackgroundRenderer`)

所有测试通过，类型检查通过，构建成功。系统具备良好的扩展性，为未来的 Image/Video/Canvas renderer 奠定了基础。

**状态**: ✅ 就绪合并
