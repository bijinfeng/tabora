# 设置弹窗还原实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** 将设置弹窗从右侧滑入抽屉改为居中模态框，完全按照设计稿还原视觉和交互体验。

**Architecture:** 保持现有的 settingsHost.tsx 组件逻辑和数据流不变，只修改 JSX 结构和 CSS 样式。从设计稿提取完整样式，映射 CSS 变量到现有系统，添加入场/退场动画。

**Tech Stack:** Solid.js, CSS, Lucide Icons

## Global Constraints

- 固定尺寸：680×390px（不实现多尺寸切换）
- 动画时长：250ms，缓动函数 cubic-bezier(0.4, 0, 0.2, 1)
- 所有表单控件必须使用 @tabora/ui 的基础组件（强制约束）
- 保持现有所有功能和数据流不变
- 保持所有现有测试通过
- CSS 变量使用 rgb(var(--color-\*)) 格式

---

### Task 1: 提取并适配设计稿样式

**Files:**

- Create: `packages/workbench-shell/src/styles/settings-new.css`（临时文件，稍后重命名）

**Interfaces:**

- Consumes: 设计稿 `docs/design/设置窗口原型.html` 的 CSS
- Produces: 完整的设置弹窗样式文件，使用项目的 CSS 变量

- [ ] **步骤 1: 从设计稿提取核心样式并创建新文件**

创建 `packages/workbench-shell/src/styles/settings-new.css`，从设计稿 HTML 提取以下 CSS（行号 138-360 左右）：

```css
/* 容器和布局 */
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--tbr-z-modal, 400);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-overlay.is-entering {
  opacity: 1;
}

.settings-window {
  width: 680px;
  height: 390px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--wb-line-strong);
  border-radius: 10px;
  background: var(--wb-surface);
  box-shadow: 0 18px 44px var(--wb-shadow-floating);
  transform: scale(0.95) translateY(12px);
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-window.is-entering {
  transform: scale(1) translateY(0);
}

/* 头部和页脚 */
.window-head,
.window-foot {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--wb-line);
  background: var(--wb-surface-soft);
}

.window-foot {
  border-top: 1px solid var(--wb-line);
  border-bottom: 0;
  color: var(--wb-text-muted);
  font-size: 11px;
}

.window-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}

.window-title-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid var(--wb-line);
  border-radius: 7px;
  background: var(--wb-surface);
  color: var(--wb-accent);
  font-size: 12px;
  font-weight: 760;
}

.window-title-main {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.window-title-main strong {
  font-size: 13px;
  line-height: 1.2;
}

.window-title-main span {
  overflow: hidden;
  color: var(--wb-text-muted);
  font-size: 11px;
  line-height: 1.25;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.icon-close {
  width: 24px;
  height: 24px;
  border: 1px solid var(--wb-line);
  border-radius: 7px;
  background: var(--wb-surface);
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.icon-close::before,
.icon-close::after {
  content: "";
  position: absolute;
  left: 7px;
  right: 7px;
  top: 50%;
  height: 1.5px;
  border-radius: 999px;
  background: var(--wb-text-muted);
}

.icon-close::before {
  transform: translateY(-50%) rotate(45deg);
}

.icon-close::after {
  transform: translateY(-50%) rotate(-45deg);
}

/* 主体区域 */
.settings-body {
  flex: 1;
  display: grid;
  grid-template-columns: 154px minmax(0, 1fr);
  gap: 10px;
  padding: 10px;
  background: var(--wb-surface);
  min-height: 0;
}

.settings-nav,
.settings-main {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
  border: 1px solid var(--wb-line);
  border-radius: 8px;
  background: var(--wb-surface);
}

.settings-nav {
  padding: 8px;
  gap: 3px;
  background: var(--wb-surface-soft);
}

/* 导航按钮 */
.nav-kicker {
  padding: 6px 8px 4px;
  color: var(--wb-text-subtle);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.nav-button {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--wb-text-muted);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms;
}

.nav-button:hover {
  background: var(--wb-surface-hover);
  color: var(--wb-text);
}

.nav-button.is-active {
  border-color: var(--wb-accent);
  background: var(--wb-accent-soft);
  color: var(--wb-accent);
}

.nav-count {
  color: var(--wb-text-subtle);
  font-size: 10px;
  font-weight: 600;
}

/* 面板内容 */
.settings-main {
  gap: 10px;
  padding: 10px;
}

.panel-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.panel-head strong {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--wb-text);
}

.panel-head span {
  color: var(--wb-text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.panel-view {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.panel-view.is-active {
  display: flex;
}

/* 设置组 */
.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 11px;
  font-weight: 650;
  color: var(--wb-text);
}

.group-title span {
  color: var(--wb-text-subtle);
  font-size: 10px;
  font-weight: 600;
}

/* 设置行 */
.setting-line {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--wb-line);
  border-radius: 7px;
  background: var(--wb-surface);
}

.setting-line-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.setting-line-copy strong {
  overflow: hidden;
  font-size: 12px;
  line-height: 1.25;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.setting-line-copy span {
  overflow: hidden;
  color: var(--wb-text-muted);
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 页脚操作 */
.footer-actions {
  display: flex;
  gap: 6px;
}

/* 错误和空状态（保留原有样式）*/
.settings-empty {
  padding: 24px 20px;
  text-align: center;
  font-size: 13px;
  color: var(--wb-text-muted);
}

.settings-panel-missing {
  padding: 12px;
  font-size: 13px;
  color: var(--wb-danger);
}
```

命令：

```bash
# 手动创建文件并粘贴上述内容
touch packages/workbench-shell/src/styles/settings-new.css
# 然后用编辑器粘贴上述 CSS
```

- [ ] **步骤 2: 映射 CSS 变量**

使用查找替换将设计稿的 `--wb-*` 变量替换为项目的 `--color-*` 变量：

```bash
cd packages/workbench-shell/src/styles
sed -i '' 's/var(--wb-surface-soft)/rgb(var(--color-surface-soft))/g' settings-new.css
sed -i '' 's/var(--wb-surface-hover)/rgb(var(--color-surface-hover))/g' settings-new.css
sed -i '' 's/var(--wb-surface)/rgb(var(--color-surface))/g' settings-new.css
sed -i '' 's/var(--wb-text-muted)/rgb(var(--color-muted))/g' settings-new.css
sed -i '' 's/var(--wb-text-subtle)/rgb(var(--color-subtle))/g' settings-new.css
sed -i '' 's/var(--wb-text)/rgb(var(--color-text))/g' settings-new.css
sed -i '' 's/var(--wb-line-strong)/rgb(var(--color-line))/g' settings-new.css
sed -i '' 's/var(--wb-line)/rgb(var(--color-line))/g' settings-new.css
sed -i '' 's/var(--wb-accent-soft)/rgb(var(--color-accent-soft))/g' settings-new.css
sed -i '' 's/var(--wb-accent)/rgb(var(--color-accent))/g' settings-new.css
sed -i '' 's/var(--wb-danger)/rgb(var(--color-danger))/g' settings-new.css
sed -i '' 's/var(--wb-shadow-floating)/rgba(0, 0, 0, 0.14)/g' settings-new.css
```

- [ ] **步骤 3: 验证 CSS 文件**

```bash
# 检查是否还有未替换的 --wb- 变量
grep "wb-" packages/workbench-shell/src/styles/settings-new.css
```

预期：没有输出（所有变量已替换）

- [ ] **步骤 4: 提交**

```bash
git add packages/workbench-shell/src/styles/settings-new.css
git commit -m "feat(settings): 提取并适配设计稿样式

- 从设计稿提取完整 CSS
- 映射 CSS 变量到项目系统
- 添加 overlay 和动画样式
- 保留错误和空状态样式

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 重构 settingsHost.tsx 的 JSX 结构

**Files:**

- Modify: `packages/workbench-shell/src/settingsHost.tsx`

**Interfaces:**

- Consumes: Task 1 的 `settings-new.css` 中的类名
- Produces: 新的 JSX 结构，包含 `.settings-window`, `.window-head`, `.settings-body`, `.window-foot`

- [ ] **步骤 1: 添加动画状态管理**

在 `settingsHost.tsx` 的 `SettingsHost` 函数内部，在现有的 `previousFocusedElement` 声明之后添加：

```typescript
const [isEntering, setIsEntering] = createSignal(false)
const [isClosing, setIsClosing] = createSignal(false)

const handleClose = () => {
  if (isClosing()) return
  setIsClosing(true)
  setIsEntering(false)
  setTimeout(() => {
    setIsClosing(false)
    props.onClose()
  }, 250)
}
```

- [ ] **步骤 2: 在现有的 createEffect 之后添加入场动画触发**

在现有的 `createEffect(() => { if (props.open) { ... } })` 之后添加：

```typescript
createEffect(() => {
  if (props.open && !isClosing()) {
    setTimeout(() => setIsEntering(true), 10)
  } else {
    setIsEntering(false)
  }
})
```

- [ ] **步骤 3: 重构最外层容器**

将第 100-107 行的：

```tsx
<div
  class="settings-overlay settings-host"
  onClick={props.onClose}
  role="dialog"
  aria-modal="true"
  aria-label={props.copy?.sidebarTitle ?? "设置"}
>
  <div class="settings-drawer" onClick={(e) => e.stopPropagation()}>
```

改为：

```tsx
<div
  class="settings-overlay settings-host"
  classList={{ "is-entering": isEntering() }}
  onClick={handleClose}
  role="dialog"
  aria-modal="true"
  aria-label={props.copy?.sidebarTitle ?? "设置"}
>
  <div class="settings-window" classList={{ "is-entering": isEntering() }} onClick={(e) => e.stopPropagation()}>
```

- [ ] **步骤 4: 添加 window-head 头部**

在 `<div class="settings-window"...>` 的开标签之后，现有的 `<nav>` 之前，插入：

```tsx
<header class="window-head">
  <div class="window-title">
    <div class="window-title-icon">⚙</div>
    <div class="window-title-main">
      <strong>设置</strong>
      <span>{activePanelTitle()}</span>
    </div>
  </div>
  <button class="icon-close" onClick={handleClose} ref={closeButtonRef} aria-label="关闭设置" />
</header>
```

- [ ] **步骤 5: 包裹主体区域**

将现有的 `<nav class="settings-sidebar">` 到 `</div>` (settings-content 结束) 之间的所有内容用 `<div class="settings-body">` 包裹。

替换第 108 行的 `<nav class="settings-sidebar">` 为：

```tsx
<div class="settings-body">
  <nav class="settings-nav">
```

然后找到对应的 `</div>` (settings-content 结束，大约第 214 行)，在它之后添加：

```tsx
  </div>
</div>
```

- [ ] **步骤 6: 更新导航类名**

将第 109 行的：

```tsx
<div class="settings-sidebar-title">{props.copy?.sidebarTitle ?? "设置"}</div>
```

改为：

```tsx
<div class="nav-kicker">工作区</div>
```

将所有 `class="settings-nav"` 的按钮改为 `class="nav-button"`，将 `classList={{ active: ... }}` 改为 `classList={{ "is-active": ... }}`。

具体位置：

- 第 112-118 行
- 第 121-128 行
- 第 131-135 行
- 第 138-142 行

示例修改：

```tsx
<button
  class="nav-button"
  classList={{ "is-active": section.id === activeSection() }}
  onClick={() => props.onSectionChange(section.id)}
>
```

- [ ] **步骤 7: 更新内容区类名并移除独立的关闭按钮**

将第 145 行的 `<div class="settings-content">` 改为 `<div class="settings-main">`。

删除第 146-153 行的整个 `settings-tab-title` 块（包含标题和关闭按钮），因为它们已经在 window-head 里了。

- [ ] **步骤 8: 更新面板容器类名**

将第 162 行左右的 `<div class="settings-tab-body">` 改为 `<div class="panel-view" data-view={activeSection()}>` 并添加 `classList={{ "is-active": true }}`：

```tsx
<div class="panel-view" classList={{ "is-active": true }} data-view={activeSection()}>
```

- [ ] **步骤 9: 添加 window-foot 页脚**

在 `</div>` (settings-window 结束) 之前，添加：

```tsx
<footer class="window-foot">
  <span>Esc 关闭</span>
  <div class="footer-actions" />
</footer>
```

- [ ] **步骤 10: 验证编译**

```bash
cd packages/workbench-shell
pnpm build
```

预期：编译成功，无错误

- [ ] **步骤 11: 提交**

```bash
git add packages/workbench-shell/src/settingsHost.tsx
git commit -m "refactor(settings): 重构 JSX 结构为居中模态框

- 添加动画状态管理（isEntering, isClosing）
- 容器改为 settings-window（居中）
- 新增 window-head 头部（图标+标题+关闭）
- 新增 window-foot 页脚（Esc 提示）
- 主体改为 settings-body 嵌套结构
- 更新类名：nav-button, is-active, panel-view

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 替换样式文件并更新测试

**Files:**

- Delete: `packages/workbench-shell/src/styles/settings.css`
- Rename: `packages/workbench-shell/src/styles/settings-new.css` → `settings.css`
- Modify: `packages/workbench-shell/src/settingsHost.test.tsx`

**Interfaces:**

- Consumes: Task 2 的新 JSX 结构和类名
- Produces: 通过所有测试的设置弹窗

- [ ] **步骤 1: 替换样式文件**

```bash
cd packages/workbench-shell/src/styles
rm settings.css
mv settings-new.css settings.css
```

- [ ] **步骤 2: 更新测试中的选择器**

在 `settingsHost.test.tsx` 中进行以下替换：

第 106 行：

```typescript
// 原来
expect(root.querySelector(".settings-drawer")).toBeTruthy()
// 改为
expect(root.querySelector(".settings-window")).toBeTruthy()
```

第 115 行：

```typescript
// 原来
const navButtons = root.querySelectorAll(".settings-nav")
// 改为
const navButtons = root.querySelectorAll(".nav-button")
```

第 117 行：

```typescript
// 原来
expect(navButtons[0].classList.contains("active")).toBe(true)
// 改为
expect(navButtons[0].classList.contains("is-active")).toBe(true)
```

第 128 行：

```typescript
// 原来
expect(navButtons[1].classList.contains("active")).toBe(true)
// 改为
expect(navButtons[1].classList.contains("is-active")).toBe(true)
```

第 145 行：

```typescript
// 原来
const closeBtn = root.querySelector(".settings-close-btn")
// 改为
const closeBtn = root.querySelector(".icon-close")
```

第 184 行：

```typescript
// 原来
const closeBtn = root.querySelector(".settings-close-btn") as HTMLButtonElement
// 改为
const closeBtn = root.querySelector(".icon-close") as HTMLButtonElement
```

第 201 行：

```typescript
// 原来
expect(root.querySelector(".settings-drawer")?.getAttribute("aria-label")).toBe("我的设置")
// 改为
expect(root.querySelector(".settings-window")?.parentElement?.getAttribute("aria-label")).toBe(
  "我的设置",
)
```

第 211、220、264、359 行类似地将 `.settings-drawer` 改为 `.settings-window`。

- [ ] **步骤 3: 运行测试**

```bash
cd packages/workbench-shell
pnpm test settingsHost.test.tsx
```

预期：所有测试通过

- [ ] **步骤 4: 如果有测试失败，检查失败原因并修复**

常见问题和修复：

1. 如果提示找不到元素，检查选择器是否正确
2. 如果动画状态导致问题，可能需要在测试中等待动画
3. 如果结构不匹配，回到 settingsHost.tsx 检查结构

修复后重新运行测试。

- [ ] **步骤 5: 提交**

```bash
git add packages/workbench-shell/src/styles/settings.css packages/workbench-shell/src/settingsHost.test.tsx
git commit -m "test(settings): 更新测试以匹配新的模态框结构

- 替换样式文件（settings-new.css → settings.css）
- 更新 CSS 选择器：settings-drawer → settings-window
- 更新按钮选择器：settings-nav → nav-button
- 更新状态类：active → is-active
- 更新关闭按钮：settings-close-btn → icon-close
- 所有测试通过

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 手动测试和视觉验证

**Files:**

- 无文件修改（纯手动测试）

**Interfaces:**

- Consumes: Task 3 完成的完整功能
- Produces: 验证报告，确认功能和视觉均符合要求

- [ ] **步骤 1: 启动开发服务器**

```bash
cd /Users/admin/Desktop/tabora
pnpm dev
```

预期：服务器启动，控制台无错误

- [ ] **步骤 2: 在浏览器中打开并触发设置**

1. 打开浏览器访问显示的地址（通常是 `http://localhost:5173`）
2. 点击左侧 rail 的设置图标，或按 `,` 键打开设置

- [ ] **步骤 3: 验证布局**

使用浏览器开发工具检查：

- ✓ 设置弹窗居中显示
- ✓ 容器尺寸为 680×390px
- ✓ 头部包含图标、"设置"标题、当前面板名、关闭按钮
- ✓ 页脚显示"Esc 关闭"
- ✓ 侧边栏约 160px 宽
- ✓ 容器圆角 10px
- ✓ 遮罩半透明 + 模糊

- [ ] **步骤 4: 验证动画**

- ✓ 打开时：遮罩淡入，模态框从缩小状态放大并上移
- ✓ 关闭时：反向动画
- ✓ 动画流畅，约 250ms
- ✓ 无闪烁或跳动

- [ ] **步骤 5: 验证交互功能**

- ✓ 点击侧边栏按钮切换面板
- ✓ 点击遮罩关闭设置
- ✓ 点击头部关闭按钮关闭
- ✓ 按 Esc 键关闭
- ✓ 打开时焦点移到关闭按钮
- ✓ 关闭后焦点返回到原元素

- [ ] **步骤 6: 逐个验证所有面板**

依次打开并检查：

- ✓ 通用设置
- ✓ 外观设置
- ✓ 搜索设置
- ✓ 插件管理
- ✓ 关于

确认每个面板正常显示，控件可交互，布局无错乱。

- [ ] **步骤 7: 对比设计稿**

1. 在新标签打开 `file:///Users/admin/Desktop/tabora/docs/design/设置窗口原型.html`
2. 在设计稿和实际应用间切换对比：
   - 尺寸和比例
   - 间距和留白
   - 字体大小和粗细
   - 颜色（特别是激活状态的绿色）
   - 圆角和边框
   - 阴影效果

- [ ] **步骤 8: 记录验证结果**

```bash
cat > /tmp/settings-verification.md << 'EOF'
# 设置弹窗还原验证报告

测试日期: 2026-07-03
浏览器: [填写]
分辨率: [填写]

## 验证结果

### 布局 ✓
- 居中显示
- 尺寸 680×390px
- 结构完整（头部、主体、页脚）

### 动画 ✓
- 打开动画流畅
- 关闭动画流畅
- 时长准确

### 交互 ✓
- 导航切换正常
- 所有关闭方式正常
- 焦点管理正确

### 视觉还原 ✓
- 与设计稿高度一致
- 无明显差异

### 功能完整性 ✓
- 所有面板正常
- 控件可交互
- 错误边界正常

## 结论
设置弹窗已成功还原，所有功能和视觉均符合设计稿要求。
EOF

cat /tmp/settings-verification.md
```

- [ ] **步骤 9: 如果发现问题，记录并修复**

如果有视觉差异或功能问题：

1. 截图保存到 `/tmp/settings-issue-[描述].png`
2. 在验证报告中记录问题
3. 修复问题（CSS 或 TSX）
4. 重新验证
5. 提交修复

- [ ] **步骤 10: 完成验证（如果一切正常则跳过提交）**

如果验证中没有发现问题，无需提交。如果修复了问题：

```bash
git add [修复的文件]
git commit -m "fix(settings): 修复视觉验证中发现的问题

[具体问题和修复描述]

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 实施总结

**已完成的改动:**

1. ✅ 样式完全还原设计稿（settings.css）
2. ✅ JSX 结构改为居中模态框（settingsHost.tsx）
3. ✅ 添加头部（图标+标题+关闭）和页脚（Esc 提示）
4. ✅ 实现打开/关闭动画（250ms 淡入+缩放）
5. ✅ 所有测试通过
6. ✅ 手动验证通过

**不变的部分:**

- Props 接口
- 导航和面板加载逻辑
- 错误边界和焦点管理
- 键盘事件处理
- 数据流

**回滚方案:**
如果遇到重大问题，可以回滚到任意提交点：

```bash
git log --oneline --grep="settings"
git revert <commit-hash>
```

**注意事项:**

- 本计划不包含 settings-controls.css 的更新（表单控件应使用 @tabora/ui 组件）
- 本计划只实现 680×390px 固定尺寸，不实现多尺寸切换
- 响应式处理只做了基本的缩小，移动端优化留待后续
