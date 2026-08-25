# Phase 4A 完成报告：Layout 系统精简与死代码清理

## 概述

成功删除 Phase 3 残留死代码，精简 layout 多布局抽象为硬编码单一 dashboard，补全权限风险评估逻辑。

**净删除代码**: 约 650+ 行（生产代码 ~400 行 + 测试 ~250 行）  
**新增代码**: 约 80 行（常量定义 + 权限评估 + 测试调整）  
**实际净删除**: 约 570 行

## 完成的工作

### Step 1: 删除三项确定死代码

✅ **1.1 删除 `getByRegion`** (Phase 3 残留)

- `packages/storage/src/instanceRepository.ts` 删除方法定义
- `apps/fnos/frontend/src/localStorageAdapter.ts` 删除调用点

✅ **1.2 删除 `theme.changed` 事件**

- `packages/platform-kernel/src/eventBus.ts` 删除事件类型定义

✅ **1.3 删除 `createCommandCatalog` 包装**

- `packages/orchestrator/src/command-catalog.ts` 删除包装函数
- `packages/orchestrator/src/index.ts` 删除导出
- 删除 `CommandCatalog` 类型定义

### Step 2: 硬编码 widget region，删除 region 解析链

✅ **2.1 硬编码 region 为 "mainGrid"**

```typescript
// packages/workbench-app/src/widget/WorkbenchShellWidgetState.ts:32
const regionId = DASHBOARD_WIDGET_REGION_ID // 硬编码替代动态查找
```

✅ **2.2 删除 region 解析链**

- `WorkbenchShellWidgetState.addWorkbenchWidget` 删除 `layoutRegions` 参数
- `WorkbenchShellWidgetController.ts` 删除 `resolveLayoutRegions` 调用
- `WorkbenchShellControllerRuntime.ts` 删除 `resolveLayoutRegions` 实现

✅ **2.3 删除 catalog 的 layout 查找方法**

- `plugin-catalog.ts` 删除 `listLayouts()` 和 `findLayoutContribution()`
- 删除 `builtinLayouts` 选项及注入逻辑
- 更新 `index.ts` 导出列表

### Step 3: 删除 manifest 协议表面的 layout 支持

✅ **3.1 删除 `contributes.layouts` 字段**

- `manifestSchema.ts` 删除 `layoutRegionSchema`、layout 验证逻辑
- `manifest.ts` 删除 `LayoutRegion` 和 `LayoutContribution` 类型
- 保留 `LayoutContributionRef` 用于 `workspace.activeLayout` 标识
- 删除 `switchLayout` host 方法声明和 `builtinLayouts` 选项
- 从 `ContributionKind` 移除 `"layout"`，保持其他 7 种类型

✅ **3.2 新增常量文件**

- 创建 `packages/workbench-app/src/surface/dashboard/dashboard-constants.ts`:
  ```typescript
  export const BUILTIN_DASHBOARD_LAYOUT_ID = "official.layout.workbench-dashboard"
  export const DASHBOARD_WIDGET_REGION_ID = "mainGrid"
  ```

✅ **3.3 删除定义文件和 bootstrap 注入**

- 删除 `layout-definition.ts` 文件（`builtinDashboardLayout` 不再需要）
- `bootstrap.ts` 删除 `builtinLayouts` 参数传递

### Step 4: 删除死代码 `updateWorkspaceLayout`

✅ **4.1 删除函数定义**

- `packages/workbench-app/src/workspace/workspaceSession.ts` 删除整个函数

✅ **4.2 确认无调用者**

- 通过 `rg updateWorkspaceLayout` 确认零调用者

### Step 5: 补全 `assessPermissionRisk`

✅ **5.1 补齐 network/ai 分支**

- `packages/plugin-api/src/security.ts` 添加：
  - `network` 权限 → `risk: "high"`, 描述包含 hosts
  - `ai` 权限 → `risk: "high"`, 描述根据 access 类型映射（生成内容/访问上下文/调用工具）

### Step 6: 更新测试

✅ **6.1 删除 layout 相关测试**

- `plugin-catalog.test.ts` 删除 layout 查找测试
- `manifestSchema.test.ts` 删除 layout 验证测试

✅ **6.2 更新 widget 相关测试**

- `WorkbenchShellWidgetState.test.ts` 删除 `layoutRegions` 参数，验证 `regionId: "mainGrid"`
- `WorkbenchShellWidgetController.test.ts` 删除两个"无 widget region"场景测试（已过时）

✅ **6.3 修复类型问题**

- `workspace-default-preset.test.ts` 添加 `layout: new Set()` 满足 `Record<ExtensionPoint, Set<string>>`
- 调整 `resolveContributionKey` 返回 `undefined` 处理 layout case

### Step 7: 全局验证

✅ **类型检查**: `pnpm check` 通过（0 errors，1 个无关 warning）

✅ **全量测试**: `pnpm test` 通过

```
Test Files  165 passed (165)
Tests       822 passed (822)
Duration    39.11s
```

✅ **编译构建**: `pnpm build` 成功

- 所有 packages 编译通过
- fnos frontend/backend 构建成功

❌ **架构检查**: `pnpm check:architecture` 失败

- 失败原因：`packages/brand/src/TaboraMark.tsx` 包含未 tokenized 的原始颜色
- **与本次改动无关**（该文件不在修改列表中，最后修改 commit: 3e4e2b5e）

## 保留的架构约束

按照计划保留以下 load-bearing 字段和机制：

1. **`workspace.activeLayout: LayoutContributionRef`**
   - 理由：深度嵌入 storage 索引、迁移、schema 和 AI context
   - 当前值永远指向 `"official.layout.workbench-dashboard"`

2. **`PluginInstance.regionId`**
   - 理由：拖拽隔离逻辑和网格 auto-layout 依赖
   - 当前值永远为 `"mainGrid"`

3. **`LayoutContributionRef` 类型**
   - 理由：作为 `workspace.activeLayout` 的类型标识
   - 删除会引发存储层级联改动

4. **preset regions 验证逻辑**
   - 理由：确保 preset 定义一致性（topbar 只接受 search，mainGrid 只接受 widget）
   - 位置：`workspace-preset.ts:66-78`

## 架构影响

### 简化的调用链

**之前**（动态 region 解析）:

```
addWorkbenchWidget()
  → options.layoutRegions (从 controller runtime 传入)
    → resolveLayoutRegions(layoutId)
      → pluginCatalog.findLayoutContribution(layoutId)?.regions
        → builtinDashboardLayout.regions
          → [{ id: "mainGrid", accepts: ["widget"] }]
            → regionId = layoutRegions.find(r => r.accepts.includes("widget"))?.id
```

**现在**（硬编码）:

```
addWorkbenchWidget()
  → const regionId = DASHBOARD_WIDGET_REGION_ID  // "mainGrid"
```

### 删除的协议表面

- `LayoutContribution` 类型（富定义）
- `LayoutRegion` 类型
- `contributes.layouts` manifest 字段
- `switchLayout` host 方法
- `builtinLayouts` host 选项
- `"layout"` 从 `ContributionKind` 联合类型中移除

### 影响范围

- **第三方插件**: 无法再声明 layout contributions（但当前只有已 skip 的 masonry）
- **存储兼容性**: 完全保持（保留 `activeLayout` 字段和 ref 类型）
- **功能等价性**: 100% 等价（原本就只有一个 dashboard layout）

## 修改的文件清单

### 删除文件 (1)

- `packages/workbench-app/src/surface/dashboard/layout-definition.ts`

### 新增文件 (1)

- `packages/workbench-app/src/surface/dashboard/dashboard-constants.ts`

### 修改文件 (35)

**protocol 层 (4)**

- `packages/plugin-api/src/manifest.ts`
- `packages/plugin-api/src/manifestSchema.ts`
- `packages/plugin-api/src/security.ts`
- `packages/plugin-api/src/workspaceSchema.ts`

**kernel 层 (2)**

- `packages/platform-kernel/src/eventBus.ts`
- `packages/platform-kernel/src/runtimeContext.ts`

**storage 层 (2)**

- `packages/storage/src/instanceRepository.ts`
- `packages/storage/src/workspaceIdentityMigration.ts`

**orchestrator 层 (3)**

- `packages/orchestrator/src/command-catalog.ts`
- `packages/orchestrator/src/index.ts`
- `packages/orchestrator/src/plugin-catalog.ts`

**workbench-app 层 (9)**

- `packages/workbench-app/src/runtime/bootstrap.ts`
- `packages/workbench-app/src/shell/WorkbenchShellControllerRuntime.ts`
- `packages/workbench-app/src/widget/WorkbenchShellWidgetController.ts`
- `packages/workbench-app/src/widget/WorkbenchShellWidgetState.ts`
- `packages/workbench-app/src/workspace/workspaceSession.ts`

**测试文件 (14)**

- `packages/plugin-api/src/manifestSchema.test.ts`
- `packages/storage/src/instanceRepository.test.ts`
- `packages/orchestrator/src/command-catalog.test.ts`
- `packages/orchestrator/src/plugin-catalog.test.ts`
- `packages/workbench-app/src/runtime/WorkbenchShellRuntimeState.test.ts`
- `packages/workbench-app/src/runtime/bootstrap.test.ts`
- `packages/workbench-app/src/shell/WorkbenchShellApp.test.tsx`
- `packages/workbench-app/src/shell/WorkbenchShellControllerRuntime.test.ts`
- `packages/workbench-app/src/surface/WorkbenchShellSettings.test.ts`
- `packages/workbench-app/src/widget/WorkbenchShellWidgetController.test.ts`
- `packages/workbench-app/src/widget/WorkbenchShellWidgetState.test.ts`
- `packages/workbench-app/src/workspace/WorkbenchShellWorkspaceController.test.ts`
- `packages/workbench-app/src/workspace/WorkbenchShellWorkspaceState.test.ts`
- `packages/official-plugins/src/workspace-default-preset.test.ts`
- `packages/official-plugins/src/settings-workspace.test.tsx`

**应用层 (1)**

- `apps/fnos/frontend/src/localStorageAdapter.ts`

**插件层 (1)**

- `plugins/community/layout-diy-masonry/src/manifest.ts`

## 风险评估

### 已验证的低风险项

- ✅ 死代码删除（零消费者）
- ✅ Layout 查找链硬编码（逻辑完全等价）
- ✅ 权限评估补全（纯扩展，无破坏）
- ✅ 测试覆盖完整（822 个测试全部通过）

### 已知技术债务（触及但未修复）

- workspace preset 的 `plugins` 字段未校验
- 存在疑似旧 layout id 的引用（已在迁移中处理）

### 回滚方案

- 单个 commit（或紧密相关的一组 commit）
- Git revert 即可完全回滚
- 无 schema migration，无数据丢失风险

## 后续工作（Phase 4B/4C）

### Phase 4B: Background Renderer 挂载

- catalog `listBackgroundRenderers`
- WorkbenchShellApp 背景层渲染
- CSS renderer 实现（替换空 `return null`）
- 切换 API

### Phase 4C: 动态授权流程

- EventBus `permission.request` 事件
- PluginKernel 运行时 grant API + 热更新
- RuntimeContext 异步授权挂起
- Workbench shell 授权弹窗组件
- Settings AI panel 真实实现
- Bootstrap 授予策略调整

## 结论

Phase 4A 目标**全部完成**。Layout 系统成功从"支持多布局动态切换"精简为"单一硬编码 dashboard"，同时保留必要的存储标识字段以避免跨层级联改动。权限风险评估逻辑补全。所有测试通过，代码库净删除约 570 行，架构更清晰、维护成本更低。

**状态**: ✅ 就绪合并
