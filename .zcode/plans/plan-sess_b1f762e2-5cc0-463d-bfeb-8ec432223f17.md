# Phase 4A 实施计划：死代码清理 + Layout 协议精简 + Permission Risk 补全

## 目标

- 删除 Phase 3 残留的死代码（getByRegion、theme.changed、createCommandCatalog）
- 精简 layout 协议：删除"多布局切换"抽象，锁定单一 dashboard（保留 activeLayout ref 标识，避免 storage 大改）
- 补全 `assessPermissionRisk` 的 network/ai 权限评估分支

**不包含**：动态授权、background renderer（后续 PR）

---

## 调查总结

### Layout 协议残留用途（唯一实际消费链）

```
addWorkbenchWidget()
  → options.layoutRegions (从 controller runtime 传入)
    → resolveLayoutRegions(layoutId)
      → pluginCatalog.findLayoutContribution(layoutId)?.regions
        → builtinDashboardLayout.regions
          → [{ id: "mainGrid", accepts: ["widget"] }]
            → regionId = layoutRegions.find(r => r.accepts.includes("widget"))?.id
```

**消费目的**：拿到 `regionId = "mainGrid"` 赋给新 widget instance。
**精简方案**：硬编码 `regionId = "mainGrid"`，删除整条查找链。

### 保留字段（load-bearing / 存储深度依赖）

1. **`workspace.activeLayout: LayoutContributionRef`**
   - storage 索引（database.ts 57/66/77/87）、迁移（workspaceIdentityMigration.ts）、schema、AI context 都依赖
   - 删除会引发跨 storage 层级联改动
   - **保留为标识字段，永远指向 `"official.layout.workbench-dashboard"`**

2. **`PluginInstance.regionId`**
   - 拖拽隔离（WorkbenchShellDragState.ts:140/206 按 regionId 过滤）
   - 网格 auto-layout（workbenchGrid.ts:50/63 按 region 维护计数器）
   - **必须保留**

3. **`preset.regions` 验证**
   - workspace-preset.ts:66-78 验证 instance 的 regionId 和 kind 兼容性
   - 确保 preset 定义一致性（topbar 只接受 search，mainGrid 只接受 widget）
   - **保留验证逻辑**

### 删除范围

#### 死代码（确定无消费者）

1. `instanceRepository.getByRegion`（Phase 3 残留）
2. `eventBus.ts:17` `theme.changed` 事件
3. `command-catalog.ts:92-95` `createCommandCatalog` 包装

#### Layout 多布局抽象

4. `plugin-catalog.ts` 中的 layout 查找：
   - `listLayouts()` (line 172-178)
   - `findLayoutContribution()` (line 277-279)
   - `builtinLayouts` 选项（line 33）+ 相关注入逻辑（line 173-176）

5. `WorkbenchShellControllerRuntime.ts` 中的 region 解析链：
   - `resolveLayoutRegions` (line 170-171)

6. `workspaceSession.ts` 中的死代码：
   - `updateWorkspaceLayout()` (line 176-180)

7. Manifest 协议表面：
   - `LayoutContribution` 类型（富定义，保留 `LayoutContributionRef`）
   - `LayoutRegion` 类型
   - `contributes.layouts` 字段（manifestSchema line 286-305）
   - Host runtime `switchLayout` 方法声明（manifest.ts:389）
   - Host `builtinLayouts` 选项（manifest.ts:485）

8. Bootstrap 注入：
   - `bootstrap.ts:409-411` 删除 `builtinLayouts` 传参

9. 定义文件：
   - `layout-definition.ts` 中的 `builtinDashboardLayout`（视图已不通过 layout.view 查找，Phase 3 后直接实例化 DashboardLayout）

---

## 实施步骤

### Step 1: 删除三项确定死代码

**1.1 删除 getByRegion（Phase 3 残留）**

- `packages/storage/src/instanceRepository.ts:7,74` 删除 `getByRegion` 方法
- `apps/fnos/frontend/src/localStorageAdapter.ts` 删除调用点

**1.2 删除 theme.changed 事件**

- `packages/platform-kernel/src/eventBus.ts:17` 删除 `"theme.changed": { themeId: string }` 类型定义

**1.3 删除 createCommandCatalog 包装**

- `packages/orchestrator/src/command-catalog.ts:92-95` 删除 `createCommandCatalog` 函数
- `packages/orchestrator/src/index.ts` 删除导出
- `packages/orchestrator/src/command-catalog.ts:13` 删除 `CommandCatalog` 类型

**验证**：`pnpm check` + focused test `packages/orchestrator`

---

### Step 2: 硬编码 widget region，删除 region 解析链

**2.1 addWorkbenchWidget 硬编码 region**

- `packages/workbench-app/src/widget/WorkbenchShellWidgetState.ts:32`
  - 删除 `options.layoutRegions.find(...)?.id`
  - 改为常量：`const regionId = "mainGrid"`
- 函数签名删除 `layoutRegions: LayoutRegion[]` 参数（line 15）

**2.2 删除调用点的 region 解析**

- `packages/workbench-app/src/widget/WorkbenchShellWidgetController.ts:84`
  - 删除 `layoutRegions: options.resolveLayoutRegions(options.getActiveLayoutId())`
- 类型定义删除 `resolveLayoutRegions` (line 48)
- `packages/workbench-app/src/shell/WorkbenchShellControllerRuntime.ts:170-171`
  - 删除 `resolveLayoutRegions` 实现

**2.3 删除 catalog 的 layout 查找方法**

- `packages/orchestrator/src/plugin-catalog.ts`:
  - 删除 `listLayouts()` (line 172-178)
  - 删除 `findLayoutContribution()` (line 277-279)
  - 删除 `builtinLayouts` 选项（line 33）+ 相关逻辑（line 173-176）
- `packages/orchestrator/src/index.ts` 删除 `listLayouts`/`findLayoutContribution` 导出

**验证**：`pnpm --dir packages/workbench-app test` + `pnpm --dir packages/orchestrator test`

---

### Step 3: 删除 manifest 协议表面的 layout 支持

**3.1 删除 contributes.layouts 字段**

- `packages/plugin-api/src/manifestSchema.ts`:
  - 删除 `layoutRegionSchema` (line 241-249)
  - 删除 `contributes.layouts` 验证（line 286-305）
  - 删除 view 收集中的 layout views (line 457)
- `packages/plugin-api/src/manifest.ts`:
  - 删除 `LayoutRegion` 类型（line 114-120）
  - 删除 `LayoutContribution` 类型（line 126-134），**保留 `LayoutContributionRef` (line 40)**
  - 删除 `contributes.layouts?` 字段（line 369）
  - 删除 `switchLayout?` host 方法声明（line 389）
  - 删除 host runtime `builtinLayouts` 选项（line 485）

**3.2 删除定义文件**

- 删除 `packages/workbench-app/src/surface/dashboard/layout-definition.ts` 文件（builtinDashboardLayout 不再注入 catalog）
- 新增常量文件 `packages/workbench-app/src/surface/dashboard/dashboard-constants.ts`:
  ```typescript
  /** Dashboard 的唯一 layout ID，用于 workspace.activeLayout 标识 */
  export const BUILTIN_DASHBOARD_LAYOUT_ID = "official.layout.workbench-dashboard"

  /** Dashboard 的 widget 区域 ID */
  export const DASHBOARD_WIDGET_REGION_ID = "mainGrid"
  ```
- 更新引用：搜索 `BUILTIN_DASHBOARD_LAYOUT_PLUGIN_ID` 导入，改为从新常量文件导入

**3.3 删除 bootstrap 注入**

- `packages/workbench-app/src/runtime/bootstrap.ts:409-411` 删除 `builtinLayouts` 参数

**验证**：`pnpm check` (全局类型检查) + `pnpm --dir packages/plugin-api test`

---

### Step 4: 删除死代码 updateWorkspaceLayout

**4.1 删除函数定义**

- `packages/workbench-app/src/workspace/workspaceSession.ts:176-180` 删除 `updateWorkspaceLayout` 函数

**4.2 确认无调用者**

- 搜索确认：`rg updateWorkspaceLayout --glob '!*.test.*'` 只在定义处

**验证**：`pnpm --dir packages/workbench-app test`

---

### Step 5: 补全 assessPermissionRisk

**5.1 补齐 network/ai 分支**

- `packages/plugin-api/src/security.ts:11-21` 修改 `assessPermissionRisk`:
  ```typescript
  export function assessPermissionRisk(permission: PluginPermission): PermissionRiskAssessment {
    switch (permission.type) {
      case "external-open":
        return {
          permission,
          risk: "medium",
          description: `可打开外部链接: ${permission.hosts.join(", ")}`,
        }
      case "network":
        return {
          permission,
          risk: "high",
          description: `可访问网络资源: ${permission.hosts.join(", ")}`,
        }
      case "ai":
        const accessDesc = permission.access
          .map(
            (a) =>
              ({
                generate: "生成内容",
                context: "访问上下文",
                tools: "调用工具",
              })[a],
          )
          .join("、")
        return {
          permission,
          risk: "high",
          description: `使用 AI 能力: ${accessDesc}`,
        }
      default:
        // 类型收窄后这分支理论上不可达，但保留兜底
        return { permission, risk: "low", description: `未知权限类型` }
    }
  }
  ```

**验证**：`pnpm --dir packages/plugin-api test`

---

### Step 6: 更新测试

**6.1 删除 layout 相关测试**

- `packages/orchestrator/src/plugin-catalog.test.ts` 删除 `findLayoutContribution`/`listLayouts` 测试

**6.2 更新 widget 相关测试**

- `packages/workbench-app/src/widget/WorkbenchShellWidgetState.test.ts` 调整 `addWorkbenchWidget` 调用（删除 layoutRegions 参数）
- `packages/workbench-app/src/widget/WorkbenchShellWidgetController.test.ts` 删除 `resolveLayoutRegions` mock

**6.3 补充 assessPermissionRisk 测试**

- `packages/plugin-api/src/security.test.ts` 新增测试用例：
  - `network` 权限 → risk: "high"
  - `ai` 权限（各 access 组合）→ risk: "high"

---

### Step 7: 全局验证

```bash
pnpm check                # 类型检查
pnpm test                 # 全量测试
pnpm build                # 编译
pnpm test:e2e             # E2E
```

**预期影响**：

- 删除约 350-400 行代码（死代码 55 + layout 查找 120 + manifest 定义 180 + 测试清理 30）
- 新增约 50 行（常量定义 + assessPermissionRisk 补全 + 测试）
- 净删除约 300-350 行

---

## 风险控制

### 低风险改动

- 三项死代码删除（getByRegion/theme.changed/createCommandCatalog）：零消费者
- updateWorkspaceLayout：零调用者
- assessPermissionRisk 补全：纯扩展

### 中风险改动

- Layout 查找链删除 + 硬编码：逻辑等价（原本就只有一个 region），但需确保测试覆盖 addWorkbenchWidget
- Manifest 协议删除：会影响第三方 layout 插件声明（但当前只有已 skip 的 masonry）

### 保留缓冲

- `workspace.activeLayout` 保留（避免 storage 层级联）
- `LayoutContributionRef` 类型保留（存储 ref 标识）
- `preset.regions` 验证逻辑保留（确保 preset 定义一致性）
- `PluginInstance.regionId` 保留（拖拽/网格 load-bearing）

### 回滚方案

- 单个 commit，Git revert 即可完全回滚
- 无 schema migration，无数据丢失风险

---

## 后续 PR（本次不含）

1. **Phase 4B: Background Renderer 挂载**
   - catalog `listBackgroundRenderers`
   - WorkbenchShellApp 背景层渲染
   - CSS renderer 实现（替换空 `return null`）
   - 切换 API

2. **Phase 4C: 动态授权流程**
   - EventBus `permission.request` 事件
   - PluginKernel 运行时 grant API + 热更新
   - RuntimeContext 异步授权挂起
   - Workbench shell 授权弹窗组件
   - Settings AI panel 真实实现
   - Bootstrap 授予策略调整

---

## 预计工作量

- Step 1-5: 约 2-3 小时（删除 + 硬编码 + risk 补全）
- Step 6: 约 1 小时（测试调整）
- Step 7: 约 30 分钟（验证）
- **总计**: 3.5-4.5 小时
