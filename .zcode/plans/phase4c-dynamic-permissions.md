# Phase 4C 实施计划：动态授权流程

## 目标

实现运行时动态权限请求和授予机制，使插件能够在需要时请求权限，用户可以通过 UI 审批。

**范围**：

- EventBus permission.request 事件
- PluginKernel 运行时 grant API + 热更新
- RuntimeContext 异步授权挂起
- Workbench shell 授权弹窗组件
- Settings AI panel 真实实现
- Bootstrap 授予策略调整

**不包含**：

- 权限撤销后的运行时清理（可选后续工作）
- 细粒度权限（如 network 的单个 URL 授权）

---

## 当前状态分析

### 已有基础设施

1. **权限类型定义** ✅
   - `PluginPermission`: ai, external-open, network
   - `PluginRecord.grantedPermissions`
   - `assessPermissionRisk()` 风险评估

2. **静态授权** ✅
   - Bootstrap 时内置插件自动授予所有权限
   - RuntimeContext 权限检查（hasGrantedHostPermission, hasAiAccess）
   - 权限不足时抛出错误

3. **EventBus** ✅
   - 基于 @solid-primitives/event-bus
   - 已有 ui.modal.open, ui.toast.show 等事件

4. **Storage** ✅
   - PluginRecordRepository 可持久化 grantedPermissions

### 缺失部分

1. **动态授权请求机制**
   - RuntimeContext 无法挂起等待授权
   - 无 permission.request 事件
   - 无异步授权 API

2. **运行时权限更新**
   - PluginKernel 无法热更新 grantedPermissions
   - RuntimeContext 无法刷新权限状态

3. **授权 UI**
   - 无权限请求弹窗组件
   - Settings 中无权限管理面板

4. **授予策略**
   - Bootstrap 硬编码信任所有内置插件
   - 无用户选择策略（自动拒绝/询问/自动允许）

---

## 设计决策

### 1. 授权请求流程

**选项 A**：同步阻塞（抛出错误，UI 重试）

- 优点：实现简单，RuntimeContext 无需改动
- 缺点：用户体验差，需要手动重试

**选项 B**：异步挂起（Promise pending）

- 优点：用户体验好，自动重试
- 缺点：RuntimeContext API 需要改为异步

**推荐**：选项 B - 异步挂起

### 2. 权限粒度

**当前实现**：粗粒度（ai 全部能力，network 全部 hosts）
**Phase 4C 范围**：保持粗粒度，简化实现
**未来扩展**：细粒度（单个 URL，单个 AI access）

### 3. 授权持久化

- 授予的权限写入 `PluginRecord.grantedPermissions`
- 每次权限变更后调用 `pluginRecordRepo.update()`
- Kernel 重启后自动恢复

### 4. UI 设计

**授权弹窗**：

- 显示插件名称、权限详情、风险等级
- 按钮：拒绝 / 仅本次允许 / 总是允许
- 可选：记住选择（不再询问）

**Settings 面板**：

- 显示所有插件的权限状态
- 支持撤销已授予的权限
- 显示风险评估

---

## 实施步骤

### Step 1: EventBus 添加 permission.request 事件

**文件**: `packages/platform-kernel/src/eventBus.ts`

```typescript
export type EventPayloads = {
  // ... 现有事件
  "permission.request": {
    pluginId: string
    permission: PluginPermission
    reason?: string
    resolve: (granted: boolean) => void
  }
}
```

**注意**：resolve 回调允许异步处理授权结果

### Step 2: PluginKernel 添加运行时 grant API

**文件**: `packages/platform-kernel/src/pluginKernel.ts`

```typescript
export type PluginKernel = {
  // ... 现有成员
  grantPermission(pluginId: string, permission: PluginPermission): Promise<void>
  revokePermission(pluginId: string, permission: PluginPermission): Promise<void>
  getGrantedPermissions(pluginId: string): PluginPermission[]
}
```

**实现要点**：

- 更新内存中的 plugin.installation.grantedPermissions
- 调用 lifecycleStore.update() 持久化
- 触发 RuntimeContext 刷新（需要添加机制）

### Step 3: RuntimeContext 异步授权挂起

**文件**: `packages/platform-kernel/src/runtimeContext.ts`

**当前**：

```typescript
function canOpenExternal(url: string): boolean {
  return hasGrantedHostPermission("external-open", url)
}
```

**改为**：

```typescript
async function canOpenExternal(url: string): Promise<boolean> {
  if (hasGrantedHostPermission("external-open", url)) {
    return true
  }

  // 请求授权
  const permission: PluginPermission = {
    type: "external-open",
    hosts: [new URL(url).hostname],
  }

  return new Promise<boolean>((resolve) => {
    options.events.emit("permission.request", {
      pluginId: options.pluginId,
      permission,
      reason: `打开外部链接: ${url}`,
      resolve,
    })
  })
}
```

**影响**：

- `permissions.openExternal()` 变为异步
- `network.fetch()` 变为异步
- `ai.*()` 方法变为异步

**破坏性变更**：插件需要 await 这些 API

### Step 4: PluginPermissionBridge 异步化

**文件**: `packages/plugin-api/src/runtime.ts`

```typescript
export type PluginPermissionBridge = {
  canOpenExternal(url: string): Promise<boolean>
  openExternal(url: string): Promise<boolean>
}
```

### Step 5: Workbench 授权弹窗组件

**新文件**: `packages/workbench-shell/src/PermissionRequestDialog.tsx`

```typescript
export type PermissionRequestDialogProps = {
  pluginId: string
  pluginName: string
  permission: PluginPermission
  reason?: string
  onResponse(granted: boolean, remember: boolean): void
  onClose(): void
}

export function PermissionRequestDialog(props: PermissionRequestDialogProps) {
  const assessment = assessPermissionRisk(props.permission)

  return (
    <Dialog open onClose={props.onClose}>
      <DialogHeader>
        权限请求
      </DialogHeader>
      <DialogContent>
        <p>插件 <strong>{props.pluginName}</strong> 请求以下权限：</p>
        <PermissionDetail
          permission={props.permission}
          risk={assessment.risk}
          description={assessment.description}
        />
        {props.reason && <p>原因：{props.reason}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.onResponse(false, false)}>
          拒绝
        </Button>
        <Button onClick={() => props.onResponse(true, false)}>
          仅本次允许
        </Button>
        <Button onClick={() => props.onResponse(true, true)} variant="primary">
          总是允许
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

### Step 6: WorkbenchShellApp 集成授权弹窗

**文件**: `packages/workbench-app/src/shell/WorkbenchShellApp.tsx`

```typescript
const [permissionRequest, setPermissionRequest] = createSignal<PermissionRequestState | null>(null)

// 监听 permission.request 事件
createEffect(() => {
  const dispose = kernel.events.on("permission.request", (payload) => {
    setPermissionRequest({
      pluginId: payload.pluginId,
      permission: payload.permission,
      reason: payload.reason,
      resolve: payload.resolve,
    })
  })
  onCleanup(dispose)
})

const handlePermissionResponse = async (granted: boolean, remember: boolean) => {
  const request = permissionRequest()
  if (!request) return

  if (granted && remember) {
    await kernel.grantPermission(request.pluginId, request.permission)
  }

  request.resolve(granted)
  setPermissionRequest(null)
}

// 在 JSX 中渲染
<Show when={permissionRequest()}>
  {(request) => (
    <PermissionRequestDialog
      pluginId={request().pluginId}
      pluginName={...}
      permission={request().permission}
      reason={request().reason}
      onResponse={handlePermissionResponse}
      onClose={() => {
        request().resolve(false)
        setPermissionRequest(null)
      }}
    />
  )}
</Show>
```

### Step 7: Settings AI Panel 真实实现

**文件**: `packages/official-plugins/src/settings-workspace.ai.tsx`

**当前**：占位符实现

**改为**：

```typescript
export function WorkspaceAiSettingsPanel(props: SettingsPanelProviderProps) {
  const plugins = createMemo(() =>
    props.data.plugins?.filter(p =>
      p.manifest.permissions?.some(perm => perm.type === "ai")
    ) ?? []
  )

  return (
    <div>
      <h2>AI 权限管理</h2>
      <For each={plugins()}>
        {(plugin) => (
          <PluginPermissionCard
            plugin={plugin}
            onGrant={(permission) =>
              props.host.grantPermission(plugin.id, permission)
            }
            onRevoke={(permission) =>
              props.host.revokePermission(plugin.id, permission)
            }
          />
        )}
      </For>
    </div>
  )
}
```

### Step 8: Bootstrap 授予策略调整

**文件**: `packages/workbench-app/src/runtime/bootstrap.ts`

**当前**：

```typescript
const trustedBuiltinPermissionGrants = Object.fromEntries(
  loadResult.loaded
    .filter((record) => record.source === "builtin")
    .map((record) => [record.manifest.id, record.manifest.permissions ?? []]),
)
```

**可选改进**（Phase 4C 不强制）：

- 添加配置：`autoGrantBuiltin: boolean`
- 用户首次运行时选择策略
- 存储到 config 中

---

## 破坏性变更评估

### API 变更

**影响的 API**：

- `permissions.openExternal(url)` → 返回 `Promise<boolean>`
- `network.fetch(url, options)` → 内部 await 权限检查
- `ai.generate()` / `ai.stream()` → 内部 await 权限检查

**插件迁移**：
需要添加 `await`:

```typescript
// 之前
if (context.permissions.canOpenExternal(url)) {
  context.permissions.openExternal(url)
}

// 之后
if (await context.permissions.canOpenExternal(url)) {
  await context.permissions.openExternal(url)
}
```

### 缓解策略

1. **渐进式迁移**
   - Phase 4C 先实现新 API，保持旧 API 同步版本
   - 添加 deprecation warning
   - Phase 4D 移除旧 API

2. **向后兼容包装**
   ```typescript
   canOpenExternalSync(url: string): boolean {
     console.warn("canOpenExternalSync is deprecated, use async version")
     return hasGrantedHostPermission("external-open", url)
   }
   ```

---

## 风险评估

### 高风险

- RuntimeContext API 异步化（破坏性变更）
- 授权弹窗阻塞用户操作（体验问题）

### 中风险

- EventBus emit/on 的并发处理
- 权限请求队列管理（多个同时请求）
- 持久化失败的错误处理

### 低风险

- UI 组件实现
- Settings 面板扩展

### 缓解措施

1. **破坏性变更**
   - 充分的文档和迁移指南
   - 保留同步 API 作为过渡期

2. **并发处理**
   - 实现请求队列，一次只处理一个授权请求
   - 相同权限的请求合并

3. **错误处理**
   - 持久化失败时 fallback 到内存
   - 授权超时机制（30 秒自动拒绝）

---

## 预计工作量

- Step 1: EventBus 事件（30 分钟）
- Step 2: PluginKernel grant API（1.5 小时）
- Step 3: RuntimeContext 异步化（2.5 小时）
- Step 4: PluginPermissionBridge 更新（1 小时）
- Step 5: 授权弹窗组件（2 小时）
- Step 6: WorkbenchShellApp 集成（1.5 小时）
- Step 7: Settings AI Panel（1.5 小时）
- Step 8: Bootstrap 策略（1 小时）
- 测试与调试（2 小时）
- **总计**: 13-15 小时

---

## 成功标准

- ✅ 插件请求权限时弹出授权对话框
- ✅ 用户可以选择拒绝/仅本次/总是允许
- ✅ 授予的权限持久化到 PluginRecord
- ✅ RuntimeContext 正确应用更新后的权限
- ✅ Settings AI 面板显示权限状态
- ✅ 所有现有测试继续通过
- ✅ 类型检查无错误

---

## 后续工作建议

### Phase 4D: API 清理

- 移除同步版本的权限 API
- 完善 deprecation warnings

### Phase 4E: 权限撤销增强

- 撤销后清理插件运行时状态
- 通知插件权限已撤销

### 可选扩展

1. **细粒度权限**
   - 单个 URL 的 network 权限
   - 单个 AI access 的授权

2. **权限审计日志**
   - 记录所有权限请求和授予
   - Settings 中显示审计历史

3. **权限预设**
   - 用户定义权限策略模板
   - 批量应用到多个插件

---

## 决策点

Phase 4C 是一个大功能，建议分阶段实施：

### 最小可行实现（MVP）

- Step 1-2: EventBus + Kernel grant API
- Step 5-6: 授权弹窗 + Shell 集成
- **不包含**：RuntimeContext 异步化（保持同步，抛出错误）

### 完整实现

- 所有 8 个步骤
- RuntimeContext 完全异步化
- 破坏性变更，需要插件迁移

**推荐**：先实施 MVP，验证 UI 和持久化，Phase 4D 再处理异步化。
