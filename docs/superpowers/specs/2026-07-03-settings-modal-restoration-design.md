# 设置弹窗还原设计文档

**日期**: 2026-07-03  
**状态**: 待审核  
**类型**: UI 还原

## 概述

将设置弹窗从右侧滑入抽屉式改为居中模态框，完全按照设计稿还原视觉和交互体验。

## 目标

1. 完全匹配 `docs/design/设置窗口原型.html` 的视觉设计
2. 保持现有功能和数据流不变
3. 实现流畅的打开/关闭动画
4. 提供更好的视觉层级和聚焦体验

## 当前状态分析

### 现有实现

**布局模式**: 右侧滑入抽屉

- 容器: `.settings-overlay` (右对齐)
- 主体: `.settings-drawer` (680px 宽，全屏高)
- 侧边栏: `.settings-sidebar` (200px 固定宽)
- 内容区: `.settings-content` (flex 1)

**缺少的元素**:

- 统一的窗口头部（每个 tab 独立显示标题）
- 窗口页脚（Esc 提示）
- 居中模态框效果
- 打开/关闭动画

**保持良好的部分**:

- 导航切换逻辑清晰
- 插件面板加载机制完善
- 错误边界处理健全
- 焦点管理正确

### 设计稿特点

**布局模式**: 居中模态框

- 尺寸: 680×390px 固定
- 位置: 屏幕居中
- 背景遮罩: 半透明 + 模糊

**结构**:

```
.settings-window
├── .window-head (头部)
│   ├── .window-title
│   │   ├── .window-title-icon (28×28 图标)
│   │   └── .window-title-main (标题+副标题)
│   └── .icon-close (关闭按钮)
├── .settings-body (主体)
│   ├── .settings-nav (侧边栏 160px)
│   └── .settings-main (内容区)
└── .window-foot (页脚)
    └── "Esc 关闭" 提示
```

**动画**:

- 打开: overlay 淡入 + modal 缩放(0.95→1) + 上移(12px→0)
- 关闭: 反向播放
- 时长: 250ms
- 缓动: cubic-bezier(0.4, 0, 0.2, 1)

## 详细设计

### 1. 布局结构改造

#### 1.1 容器层

**从**:

```tsx
<div class="settings-overlay" onClick={props.onClose}>
  <div class="settings-drawer" onClick={(e) => e.stopPropagation()}>
    {/* ... */}
  </div>
</div>
```

**到**:

```tsx
<div class="settings-overlay" onClick={props.onClose}>
  <div class="settings-window" onClick={(e) => e.stopPropagation()}>
    <header class="window-head">{/* 新增 */}</header>
    <div class="settings-body">{/* 重构 */}</div>
    <footer class="window-foot">{/* 新增 */}</footer>
  </div>
</div>
```

**CSS 关键变化**:

```css
/* 原来 */
.settings-overlay {
  justify-content: flex-end; /* 右对齐 */
}
.settings-drawer {
  width: min(680px, 100vw);
  height: 100vh;
}

/* 改为 */
.settings-overlay {
  justify-content: center; /* 居中 */
  align-items: center;
}
.settings-window {
  width: 680px;
  height: 390px; /* 固定高度 */
  border-radius: 10px;
}
```

#### 1.2 头部结构

**新增组件**:

```tsx
<header class="window-head">
  <div class="window-title">
    <div class="window-title-icon">⚙</div>
    <div class="window-title-main">
      <strong>设置</strong>
      <span>{当前面板标题}</span>
    </div>
  </div>
  <button class="icon-close" onClick={props.onClose} ref={closeButtonRef}>
    {/* X 图标 */}
  </button>
</header>
```

**样式规范**:

- 高度: padding 10px 12px (总高约 48px)
- 背景: `var(--wb-surface-soft)` 浅色
- 底部边框: 1px solid `var(--wb-line)`
- 图标: 28×28px, 圆角 7px, 边框, 绿色
- 主标题: 13px 粗体
- 副标题: 11px 灰色

#### 1.3 主体结构

**从**:

```tsx
<nav class="settings-sidebar">{/* 侧边栏 */}</nav>
<div class="settings-content">{/* 内容 */}</div>
```

**到**:

```tsx
<div class="settings-body">
  <nav class="settings-nav">{/* 侧边栏 */}</nav>
  <div class="settings-main">{/* 内容 */}</div>
</div>
```

**布局调整**:

- `settings-body`: 包裹容器，flex 布局
- `settings-nav`: 侧边栏，160px 固定宽（原 200px）
- `settings-main`: 内容区，flex: 1

#### 1.4 页脚结构

**新增组件**:

```tsx
<footer class="window-foot">
  <span>Esc 关闭</span>
  <div class="footer-actions">{/* 预留按钮位置，初期为空 */}</div>
</footer>
```

**样式规范**:

- 高度: padding 10px 12px
- 背景: `var(--wb-surface-soft)`
- 顶部边框: 1px solid `var(--wb-line)`
- 文字: 11px 灰色

### 2. 样式完全移植

#### 2.1 CSS 文件改造策略

**方案**: 直接从设计稿提取完整 CSS，替换 `settings.css`

**提取范围**:

- 所有 `.settings-*` 相关规则
- 所有 `.window-*` 相关规则
- 所有 `.panel-*` 相关规则
- 所有 `.nav-*` 相关规则

**CSS 变量映射**:
设计稿使用 `--wb-*` 前缀，需要映射到现有的 `--color-*`:

```css
/* 设计稿 → 当前变量 */
--wb-surface       → rgb(var(--color-surface))
--wb-surface-soft  → rgb(var(--color-surface-soft))
--wb-text          → rgb(var(--color-text))
--wb-text-muted    → rgb(var(--color-muted))
--wb-text-subtle   → rgb(var(--color-subtle))
--wb-line          → rgb(var(--color-line))
--wb-accent        → rgb(var(--color-accent))
--wb-accent-soft   → rgb(var(--color-accent-soft))
--wb-danger        → rgb(var(--color-danger))
```

**保留的现有样式**:

- 插件边界错误样式
- 空状态样式
- 面板缺失提示样式

#### 2.2 控件样式

**settings-controls.css 调整**:

- 按设计稿更新所有表单控件样式
- 包括: select, input, textarea, switch, segmented, keybind 等
- 圆角统一为 7px
- 边框颜色统一为 `var(--wb-line)`

#### 2.3 导航样式

**按钮状态**:

```css
.settings-nav {
  padding: 9px 12px;
  border-radius: 7px;
  font-size: 12px;
  transition: all 120ms;
}

.settings-nav:hover {
  background: var(--wb-surface-hover);
  color: var(--wb-text);
}

.settings-nav.is-active {
  background: var(--wb-accent-soft);
  color: var(--wb-accent);
  font-weight: 650;
}
```

**分组标题**:

```css
.nav-kicker {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--wb-text-subtle);
  padding: 12px 12px 6px;
}
```

### 3. 动画实现

#### 3.1 打开动画

**入场序列**:

1. overlay 从透明到半透明 (0 → 0.2)
2. modal 同时: scale(0.95) + translateY(12px) → scale(1) + translateY(0)
3. 时长: 250ms
4. 缓动: cubic-bezier(0.4, 0, 0.2, 1)

**实现方式**:
使用 Solid.js 的 `<Transition>` 或手动控制 class:

```tsx
<Show when={props.open}>
  <div class="settings-overlay" classList={{ "is-entering": isEntering() }}>
    <div class="settings-window" classList={{ "is-entering": isEntering() }}>
      {/* ... */}
    </div>
  </div>
</Show>
```

**CSS**:

```css
.settings-overlay {
  opacity: 0;
  transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-overlay.is-entering {
  opacity: 1;
}

.settings-window {
  transform: scale(0.95) translateY(12px);
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-window.is-entering {
  transform: scale(1) translateY(0);
}
```

#### 3.2 关闭动画

**退场序列**:

- 反向播放入场动画
- 动画完成后才移除 DOM

**实现**:

```tsx
const [isClosing, setIsClosing] = createSignal(false)

const handleClose = () => {
  setIsClosing(true)
  setTimeout(() => {
    props.onClose()
    setIsClosing(false)
  }, 250)
}
```

### 4. 组件层改动

#### 4.1 settingsHost.tsx

**主要改动**:

1. 重构 JSX 结构（添加 head/foot）
2. 更新所有 class 名称
3. 添加动画状态管理
4. 更新头部标题逻辑

**不变的部分**:

- Props 接口
- 导航逻辑（`createSettingsNavigator`）
- 面板渲染逻辑
- 错误边界
- 焦点管理
- 键盘事件处理

#### 4.2 类名对应关系

**完整映射表**:

```
settings-drawer        → settings-window
settings-sidebar       → settings-nav (重命名)
settings-sidebar-title → nav-kicker (更新样式)
settings-nav           → nav-button (保持逻辑)
settings-content       → settings-main (包裹在 settings-body 内)
settings-tab-title     → window-head (新结构)
settings-close-btn     → icon-close (新样式)
settings-tab-body      → panel-view (更精确)
```

### 5. 响应式处理

#### 5.1 桌面端 (> 980px)

- 固定尺寸: 680×390px
- 居中显示
- 完整动画

#### 5.2 窄屏 (≤ 980px)

**初期实现**:

- 宽度改为 `min(680px, calc(100vw - 32px))`
- 高度改为 `min(390px, calc(100vh - 64px))`
- 保持居中

**后续优化** (本次不实现):

- < 768px 时切换回全屏抽屉
- 侧边栏改为顶部 tabs

### 6. 测试策略

#### 6.1 视觉回归测试

**对比检查**:

- 打开设计稿 HTML 在浏览器中
- 打开本地开发环境
- 逐像素对比各个状态

**检查项**:

- 容器尺寸和位置
- 头部布局和间距
- 侧边栏按钮样式
- 面板内容区布局
- 页脚样式
- 各种表单控件

#### 6.2 功能测试

**不应该改变的行为**:

- 导航切换正常
- 插件面板加载正常
- Esc 键关闭
- 点击遮罩关闭
- 焦点管理正确
- 错误边界工作

#### 6.3 动画测试

**验证项**:

- 打开动画流畅
- 关闭动画流畅
- 无闪烁或跳动
- 动画时长准确 (250ms)

### 7. 实施步骤

#### 阶段 1: 样式准备

1. 从设计稿提取完整 CSS
2. 替换 `settings.css`
3. 映射 CSS 变量
4. 更新 `settings-controls.css`

#### 阶段 2: 结构改造

1. 更新 `settingsHost.tsx` 的 JSX 结构
2. 添加头部组件
3. 添加页脚组件
4. 重构主体布局

#### 阶段 3: 动画实现

1. 添加动画状态管理
2. 实现入场动画
3. 实现退场动画
4. 测试动画流畅度

#### 阶段 4: 测试验证

1. 视觉对比
2. 功能回归测试
3. 动画测试
4. 响应式测试

## 风险和应对

### 风险 1: CSS 变量不完全匹配

**影响**: 颜色、间距可能有细微差异

**应对**:

- 先全局搜索确认所有 CSS 变量的定义
- 如果缺少变量，在 `:root` 中补充
- 优先使用现有变量系统

### 风险 2: 动画性能问题

**影响**: 低性能设备可能卡顿

**应对**:

- 只使用 transform 和 opacity (GPU 加速)
- 避免 width/height 动画
- 提供 `prefers-reduced-motion` 支持

### 风险 3: 插件面板布局兼容性

**影响**: 某些插件面板可能布局错乱

**应对**:

- 保持 `.settings-main` 的滚动容器特性
- 保持内容区的最小尺寸
- 测试所有官方插件面板

### 风险 4: 现有用户习惯改变

**影响**: 用户习惯了右侧抽屉

**应对**:

- 居中模态框是更标准的设计模式
- 视觉层级更清晰
- 动画引导用户注意力
- 功能和快捷键保持一致

## 成功标准

1. ✅ 视觉完全匹配设计稿（误差 < 2px）
2. ✅ 所有现有功能正常工作
3. ✅ 动画流畅（60fps）
4. ✅ 无控制台错误或警告
5. ✅ 所有测试通过

## 附录

### A. 文件清单

**需要修改的文件**:

- `packages/workbench-shell/src/settingsHost.tsx` - 主组件
- `packages/workbench-shell/src/styles/settings.css` - 主样式
- `packages/workbench-shell/src/styles/settings-controls.css` - 控件样式

**参考文件**:

- `docs/design/设置窗口原型.html` - 设计稿

### B. CSS 类名完整映射

```
旧类名                    → 新类名                  说明
────────────────────────────────────────────────────────
.settings-overlay         → .settings-overlay       保持
.settings-drawer          → .settings-window        容器改为模态框
.settings-sidebar         → .settings-nav           侧边栏导航
.settings-sidebar-title   → .nav-kicker            分组标题
.settings-sidebar-spacer  → 移除                    不需要
.settings-nav             → .nav-button            导航按钮
.settings-nav.active      → .nav-button.is-active  激活状态
.settings-content         → .settings-main         内容区
.settings-tab-title       → .window-head           统一头部
.settings-close-btn       → .icon-close            关闭按钮
.settings-tab-body        → .panel-view            面板视图
.settings-group           → .setting-group         设置组
.settings-group-title     → .group-title           组标题
.settings-row             → .setting-line          设置行
.settings-row-label       → .setting-line-copy     行文案
```

### C. 关键尺寸规范

```
元素                   尺寸
──────────────────────────────────
模态框总尺寸           680 × 390 px
圆角                   10px
头部 padding           10px 12px
头部图标               28 × 28 px
头部图标圆角           7px
关闭按钮               24 × 24 px
侧边栏宽度             160px
导航按钮 padding       9px 12px
导航按钮圆角           7px
设置行 padding         8px
设置行圆角             7px
页脚 padding           10px 12px
```
