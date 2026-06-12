import type { SiteLocale } from "../../app/AppShell"

import type { DocsExampleId } from "./docsExamples"

export type DocsSidebarGroup = {
  title: string
  items: Array<{
    id: string
    label: string
  }>
}

export type DocsCodeBlock = {
  label: string
  copyLabel: string
  copiedLabel: string
  copyId?: string
  code: string
}

export type DocsDemoSection = {
  title: string
  codeBlock?: DocsCodeBlock
  treeBlock?: {
    label: string
    code: string
  }
}

export type DocsTable = {
  columns: string[]
  rows: string[][]
}

export type DocsRegisteredDemo = {
  title: string
  exampleId: DocsExampleId
}

export type DocsLegacyDemo = {
  title: string
  previewHtml: string
  codeBlock: DocsCodeBlock
}

export type DocsComponentDemo = DocsRegisteredDemo | DocsLegacyDemo

export type DocsComponentSpec = {
  id: string
  title: string
  description: string
  metaTags: string[]
  anatomyTitle?: string
  anatomyItems?: string[]
  demos: DocsComponentDemo[]
  table: DocsTable
  doTitle: string
  doBody: string
  dontTitle: string
  dontBody: string
  pluginExample?: DocsCodeBlock
}

export type DocsPageContent = {
  sidebarTitle: string
  sidebarGroups: DocsSidebarGroup[]
  sections: {
    quickstart: {
      eyebrow: string
      title: string
      description: string
      demos: DocsDemoSection[]
    }
    manifest: {
      eyebrow: string
      title: string
      description: string
      anatomyTitle: string
      anatomyItems: string[]
      codeBlock: DocsCodeBlock
      table: DocsTable
    }
    runtime: {
      eyebrow: string
      title: string
      description: string
      demos: DocsDemoSection[]
      table: DocsTable
    }
    contributions: {
      eyebrow: string
      title: string
      description: string
      table: DocsTable
      doTitle: string
      doBody: string
      dontTitle: string
      dontBody: string
    }
    tokens: {
      eyebrow: string
      title: string
      description: string
      previewTitle: string
      swatches: Array<{
        name: string
        style: string
      }>
      table: DocsTable
    }
  }
  componentSpecs: {
    inputControls: DocsComponentSpec[]
    selectionControls: DocsComponentSpec[]
  }
}

const docsPageContent: Record<SiteLocale, DocsPageContent> = {
  "zh-CN": {
    sidebarTitle: "Tabora Docs",
    sidebarGroups: [
      {
        title: "开始",
        items: [
          { id: "quickstart", label: "快速开始" },
          { id: "manifest", label: "Manifest" },
          { id: "runtime", label: "Runtime API" },
          { id: "contributions", label: "贡献点类型" },
          { id: "tokens", label: "Design Tokens" },
        ],
      },
      {
        title: "输入控件",
        items: [
          { id: "button", label: "Button 按钮" },
          { id: "input", label: "Input 输入框" },
          { id: "textarea", label: "Textarea 多行输入" },
        ],
      },
      {
        title: "选择控件",
        items: [
          { id: "select", label: "Select 选择器" },
          { id: "checkbox", label: "Checkbox 复选框" },
          { id: "switch", label: "Switch 开关" },
          { id: "radio", label: "Radio 单选框" },
        ],
      },
      {
        title: "浮层与菜单",
        items: [
          { id: "tabs", label: "Tabs 标签页" },
          { id: "dialog", label: "Dialog 对话框" },
          { id: "drawer", label: "Drawer 抽屉" },
          { id: "tooltip", label: "Tooltip 工具提示" },
        ],
      },
      {
        title: "反馈与通知",
        items: [
          { id: "toast", label: "Toast 轻提示" },
          { id: "progress", label: "Spinner / Progress" },
          { id: "skeleton", label: "Skeleton 骨架屏" },
          { id: "empty", label: "Empty State 空状态" },
        ],
      },
      {
        title: "标签与结构",
        items: [
          { id: "badge", label: "Badge 徽标" },
          { id: "table", label: "Table 表格" },
          { id: "card", label: "Card 卡片" },
        ],
      },
    ],
    sections: {
      quickstart: {
        eyebrow: "QUICKSTART",
        title: "三步创建第一个 Tabora 插件",
        description:
          "Tabora 插件目录保持极简：manifest 声明贡献点，组件文件只负责插件内容区，宿主能力通过 runtime context 请求，不存在直接 DOM 操控。",
        demos: [
          {
            title: "1 — 创建目录结构",
            codeBlock: {
              label: "terminal",
              copyLabel: "复制",
              copiedLabel: "已复制",
              copyId: "qs-cmd",
              code: `mkdir plugins/today-focus
cd plugins/today-focus
touch tabora.plugin.json TodayFocusWidget.tsx`,
            },
          },
          {
            title: "2 — 目录结构",
            treeBlock: {
              label: "文件树",
              code: `plugins/today-focus/
├── tabora.plugin.json      # 插件 manifest
├── TodayFocusWidget.tsx    # widget 入口组件
├── TodayFocusSettings.tsx  # 设置面板（可选）
└── assets/                 # 私有资源目录（可选）`,
            },
          },
          {
            title: "3 — 最小 manifest",
            codeBlock: {
              label: "tabora.plugin.json",
              copyLabel: "复制",
              copiedLabel: "已复制",
              copyId: "qs-manifest",
              code: `{
  "id": "official.widgets.today-focus",
  "name": "Today Focus",
  "version": "1.0.0",
  "contributions": {
    "widgets": [{ "id": "today-focus", "title": "今日重点", "entry": "./TodayFocusWidget.tsx", "sizes": ["medium", "large"] }]
  },
  "permissions": ["storage:read", "storage:write"]
}`,
            },
          },
        ],
      },
      manifest: {
        eyebrow: "MANIFEST",
        title: "Manifest 只描述能力，不写宿主实现",
        description:
          "所有贡献点通过 contributions 字段声明。插件不能直接创建全局容器，只能请求 runtime 提供的宿主能力。",
        anatomyTitle: "字段结构",
        anatomyItems: [
          "id — 全局唯一，格式 namespace.category.name",
          "name — 用户可见的显示名称",
          "version — 遵循 semver，宿主用于更新判断",
          "contributions — 声明贡献点对象，支持 widgets / layouts / searchProviders / settingsPanels",
          "permissions — 需要的宿主权限列表，用户可在设置中撤销",
        ],
        codeBlock: {
          label: "完整 manifest 示例",
          copyLabel: "复制",
          copiedLabel: "已复制",
          copyId: "manifest-full",
          code: `{
  "id": "official.widgets.today-focus",
  "name": "Today Focus",
  "version": "1.0.0",
  "contributions": {
    "widgets": [
      {
        "id": "today-focus",
        "title": "今日重点",
        "entry": "./TodayFocusWidget.tsx",
        "sizes": ["medium", "large"],
        "settingsPanel": "today-focus-settings"
      }
    ],
    "settingsPanels": [
      {
        "id": "today-focus-settings",
        "title": "今日重点设置",
        "entry": "./TodayFocusSettings.tsx"
      }
    ]
  },
  "permissions": ["storage:read", "storage:write"]
}`,
        },
        table: {
          columns: ["字段", "类型", "必须", "说明"],
          rows: [
            ["id", "string", "✓", "全局唯一标识符，推荐三段式命名"],
            ["name", "string", "✓", "用户可见名称，不超过 32 字符"],
            ["version", "string", "✓", "semver 格式：1.0.0"],
            ["contributions", "object", "✓", "贡献点声明对象，至少一个子字段"],
            ["permissions", "string[]", "—", "需要的权限列表，默认空数组"],
            ["description", "string", "—", "插件描述，显示在设置面板和商店"],
          ],
        },
      },
      runtime: {
        eyebrow: "RUNTIME API",
        title: "插件通过 runtime context 使用宿主能力",
        description:
          "每类贡献点的入口组件都收到 runtime prop，提供存储、外部链接、Toast、全局状态等宿主能力。",
        demos: [
          {
            title: "Widget 示例",
            codeBlock: {
              label: "TodayFocusWidget.tsx",
              copyLabel: "复制",
              copiedLabel: "已复制",
              copyId: "rt-widget",
              code: `export function TodayFocusWidget({ runtime }) {
  const tasks = runtime.storage.useList("tasks")

  return (
    <CardSection title="今日重点">
      {tasks.map((task) => (
        <ListRow key={task.id} title={task.title}>
          <Checkbox checked={task.done} onCheckedChange={(v) => runtime.storage.update(task.id, { done: v })} />
        </ListRow>
      ))}
      <Button variant="secondary" size="sm" onClick={() => runtime.toast.show({ title: "已添加" })}>
        添加任务
      </Button>
    </CardSection>
  )
}`,
            },
          },
          {
            title: "Search Provider 示例",
            codeBlock: {
              label: "githubProvider.ts",
              copyLabel: "复制",
              copiedLabel: "已复制",
              copyId: "rt-search",
              code: `export const githubProvider = {
  id: "github",
  label: "GitHub",
  prefix: "@github",
  async query(input: string, runtime) {
    if (!input.trim()) return []
    const url = \`https://github.com/search?q=\${encodeURIComponent(input)}\`
    return [{
      id: "github-search",
      title: input,
      subtitle: "在 GitHub 搜索",
      action: () => runtime.external.open(url)
    }]
  }
}`,
            },
          },
          {
            title: "Settings Panel 示例",
            codeBlock: {
              label: "TodayFocusSettings.tsx",
              copyLabel: "复制",
              copiedLabel: "已复制",
              copyId: "rt-settings",
              code: `export function TodayFocusSettings({ runtime }) {
  const compact = runtime.settings.useBoolean("compact", false)
  const maxItems = runtime.settings.useNumber("maxItems", 5)

  return (
    <>
      <Field label="紧凑模式" description="减少卡片内留白，适合小尺寸 widget。">
        <Switch checked={compact.value} onCheckedChange={compact.set} />
      </Field>
      <Field label="最多显示条目">
        <Select value={maxItems.value.toString()} onValueChange={(v) => maxItems.set(Number(v))}>
          <SelectItem value="3">3 条</SelectItem>
          <SelectItem value="5">5 条</SelectItem>
          <SelectItem value="10">10 条</SelectItem>
        </Select>
      </Field>
    </>
  )
}`,
            },
          },
        ],
        table: {
          columns: ["runtime 命名空间", "说明", "常用方法"],
          rows: [
            ["runtime.storage", "持久化键值与列表存储", "useList, get, set, update, remove"],
            ["runtime.toast", "触发宿主全局 Toast", "show({ title, variant })"],
            ["runtime.external", "安全打开外部链接", "open(url)"],
            ["runtime.settings", "插件级设置持久化", "useBoolean, useString, useNumber"],
            ["runtime.theme", "读取当前主题状态", "useColorScheme()"],
          ],
        },
      },
      contributions: {
        eyebrow: "CONTRIBUTION TYPES",
        title: "四类贡献点覆盖工作台全部可见体验",
        description:
          "每类贡献点都在 manifest 的 contributions 字段声明。宿主在启动时发现并挂载它们。",
        table: {
          columns: ["贡献点", "字段名", "用途", "尺寸约束"],
          rows: [
            ["Widget", "widgets", "工作台卡片内容区", "small / medium / large"],
            ["Layout", "layouts", "自定义整体布局方案", "全屏，宿主管理容器"],
            ["Search Provider", "searchProviders", "搜索框自定义数据源", "下拉列表，宿主渲染"],
            ["Settings Panel", "settingsPanels", "插件专属设置界面", "宿主 modal 内"],
          ],
        },
        doTitle: "✓ 应当",
        doBody:
          "每类贡献点只写内容逻辑，不接管外壳。widget 只关心卡片内部 DOM，layout 只关心插槽排布。",
        dontTitle: "✗ 不应",
        dontBody:
          "不要在 widget 内部创建全局 modal 或独立 toast，这些都由 runtime.toast 和宿主提供，避免 z-index 冲突。",
      },
      tokens: {
        eyebrow: "DESIGN TOKENS",
        title: "Refined Sage V2.3 — CSS 自定义属性",
        description:
          "所有组件通过 CSS 变量消费设计令牌，深色模式由 .dark 类自动切换，插件内容区继承宿主令牌，无需额外处理。",
        previewTitle: "色彩令牌预览",
        swatches: [
          {
            name: "--cp-accent",
            style:
              "padding: 10px 12px; background: var(--cp-accent); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
          },
          {
            name: "--cp-accent-soft",
            style:
              "padding: 10px 12px; background: var(--cp-accent-soft); color: var(--cp-accent); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-surface",
            style:
              "padding: 10px 12px; background: var(--cp-surface); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-surface-soft",
            style:
              "padding: 10px 12px; background: var(--cp-surface-soft); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-surface-hover",
            style:
              "padding: 10px 12px; background: var(--cp-surface-hover); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-page",
            style:
              "padding: 10px 12px; background: var(--cp-page); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-danger",
            style:
              "padding: 10px 12px; background: var(--cp-danger); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
          },
          {
            name: "--cp-success",
            style:
              "padding: 10px 12px; background: var(--cp-success); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
          },
        ],
        table: {
          columns: ["令牌", "亮色值", "暗色值", "用途"],
          rows: [
            ["--cp-accent", "#1a9070", "#34d19e", "主强调色，按钮、链接、焦点环"],
            ["--cp-accent-soft", "#eaf5f0", "#1a2e26", "柔和强调背景，chip 选中态"],
            ["--cp-surface", "#ffffff", "#252927", "卡片、输入框、浮层背景"],
            ["--cp-text", "#1c1e1c", "#edf0ed", "主文本"],
            ["--cp-text-muted", "#6b6e6a", "#b6bab6", "次级文本、占位符"],
            ["--cp-line", "#e6e8e3", "#3b403c", "分隔线、边框"],
            ["--cp-danger", "#c94545", "#ef8b8b", "危险/错误状态"],
            ["--cp-radius-control", "8px", "8px", "按钮、输入框等控件圆角"],
          ],
        },
      },
    },
    componentSpecs: {
      inputControls: [
        {
          id: "button",
          title: "Button 按钮",
          description:
            "主操作触发器。6 种变体 × 3 尺寸 × 2 状态。插件内容区优先使用 primary 和 secondary，危险操作必须搭配二次确认 Dialog。",
          metaTags: ["6 变体", "3 尺寸", "按钮组", "图标按钮"],
          anatomyTitle: "解剖结构",
          anatomyItems: [
            ".btn — 基础类，所有变体必须搭配",
            ".btn-{variant} — primary / secondary / subtle / ghost / danger / danger-subtle",
            ".btn-{size} — sm (28px) / md (36px) / lg (44px)",
            ".btn-full — 拉伸至父容器宽度",
            ".btn-group — 包裹容器，连接为一组",
          ],
          demos: [
            { title: "变体", exampleId: "button.variants" },
            { title: "尺寸", exampleId: "button.sizes" },
            { title: "禁用 & 全宽", exampleId: "button.disabled-full" },
            { title: "按钮组 & 图标按钮", exampleId: "button.group-icon" },
          ],
          table: {
            columns: ["变体", "背景", "文字色", "适用场景"],
            rows: [
              [".btn-primary", "--cp-accent", "#fff", "每屏唯一最重要操作"],
              [".btn-secondary", "--cp-surface", "--cp-text", "次级操作、取消、导航"],
              [".btn-subtle", "--cp-accent-soft", "--cp-accent", "工具栏、筛选区低权重操作"],
              [".btn-ghost", "transparent", "--cp-text-muted", "内联操作、卡片内辅助按钮"],
              [".btn-danger", "--cp-danger", "#fff", "不可逆破坏操作，需二次确认"],
              [
                ".btn-danger-subtle",
                "--cp-danger-soft",
                "--cp-danger",
                "危险低强度版本，可直接展示",
              ],
            ],
          },
          doTitle: "✓ 应当",
          doBody:
            "每个功能区最多一个 primary 按钮。用 secondary 或 ghost 做辅助操作，保持视觉层级清晰。",
          dontTitle: "✗ 不应",
          dontBody:
            "不要在同一行放多个 primary 按钮。danger 操作不能是第一步，必须搭配确认 Dialog。",
          pluginExample: {
            label: "插件使用示例",
            copyLabel: "复制",
            copiedLabel: "已复制",
            copyId: "btn-code",
            code: `// 基础用法
<Button variant="primary">确认</Button>
<Button variant="secondary">取消</Button>
<Button variant="ghost" size="sm">查看详情</Button>

// 危险操作（搭配 Dialog）
<Button variant="danger" onClick={() => setConfirmOpen(true)}>删除记录</Button>

// 全宽
<Button variant="primary" fullWidth>开始同步</Button>`,
          },
        },
        {
          id: "input",
          title: "Input 输入框",
          description:
            "单行文本输入控件。支持 3 种尺寸、前后缀插槽、4 种验证状态。所有输入组件共享相同圆角和边框令牌。",
          metaTags: ["3 尺寸", "4 状态", "前后缀", "可清除"],
          demos: [
            {
              title: "尺寸",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><input class="ipt ipt-sm" placeholder="Small — 28px 高度" /><input class="ipt" placeholder="Medium（默认）— 36px 高度" /><input class="ipt ipt-lg" placeholder="Large — 44px 高度" /></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "复制",
                copiedLabel: "已复制",
                code: `<input class="ipt ipt-sm" placeholder="Small — 28px 高度" />
<input class="ipt" placeholder="Medium（默认）— 36px 高度" />
<input class="ipt ipt-lg" placeholder="Large — 44px 高度" />`,
              },
            },
            {
              title: "状态",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><input class="ipt" placeholder="默认状态" /><input class="ipt ipt-success" value="验证通过" /><input class="ipt ipt-error" value="输入有误" /><input class="ipt" disabled value="禁用状态" /></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "复制",
                copiedLabel: "已复制",
                code: `<input class="ipt" placeholder="默认状态" />
<input class="ipt ipt-success" value="验证通过" />
<input class="ipt ipt-error" value="输入有误" />
<input class="ipt" disabled value="禁用状态" />`,
              },
            },
            {
              title: "前后缀 & 可清除",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><div class="ipt-wrap"><span class="ipt-prefix">🔍</span><input class="ipt" placeholder="搜索插件..." /></div><div class="ipt-wrap"><input class="ipt" placeholder="输入标签" /><span class="ipt-suffix">⏎</span></div><div class="ipt-wrap"><input class="ipt" value="可清除内容" /><button class="ipt-clear" type="button">✕</button></div></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "复制",
                copiedLabel: "已复制",
                code: `<!-- 前缀 -->
<div class="ipt-wrap">
  <span class="ipt-prefix">🔍</span>
  <input class="ipt" placeholder="搜索插件..." />
</div>

<!-- 后缀 -->
<div class="ipt-wrap">
  <input class="ipt" placeholder="输入标签" />
  <span class="ipt-suffix">⏎</span>
</div>

<!-- 可清除 -->
<div class="ipt-wrap">
  <input class="ipt" value="可清除内容" />
  <button class="ipt-clear" type="button">✕</button>
</div>`,
              },
            },
            {
              title: "带标签 & 提示",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 16px"><div class="field"><label class="field-label">用户名 <span class="field-required">*</span></label><input class="ipt" placeholder="请输入用户名" /><span class="field-hint">3-20 个字符，仅支持字母和数字</span></div><div class="field"><label class="field-label">描述</label><input class="ipt ipt-error" value="内容过长" /><span class="field-error">超出最大长度限制（100 字符）</span></div></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "复制",
                copiedLabel: "已复制",
                code: `<div class="field">
  <label class="field-label">用户名 <span class="field-required">*</span></label>
  <input class="ipt" placeholder="请输入用户名" />
  <span class="field-hint">3-20 个字符，仅支持字母和数字</span>
</div>

<div class="field">
  <label class="field-label">描述</label>
  <input class="ipt ipt-error" value="内容过长" />
  <span class="field-error">超出最大长度限制（100 字符）</span>
</div>`,
              },
            },
          ],
          table: {
            columns: ["属性", "类名 / 值", "说明"],
            rows: [
              ["尺寸", ".ipt-sm / 默认 / .ipt-lg", "28px / 36px / 44px 高度"],
              ["验证态", ".ipt-success / .ipt-error", "绿色 / 红色边框反馈"],
              ["禁用", "disabled", "降低透明度，阻止交互"],
              ["容器", ".ipt-wrap", "用于前后缀定位"],
              ["前缀", ".ipt-prefix", "图标或文字，位于左侧"],
              ["后缀", ".ipt-suffix", "图标或文字，位于右侧"],
              ["清除", ".ipt-clear", "内容非空时显示清除按钮"],
            ],
          },
          doTitle: "✓ 应当",
          doBody:
            "始终提供 placeholder 暗示预期格式。错误状态必须同步显示 .field-error 提示文字。对表单类输入必须包裹 label。",
          dontTitle: "✗ 不应",
          dontBody:
            "不要用 title 属性替代 label。禁止把关键说明只放在 placeholder 里，用户输入后它就消失了。",
        },
        {
          id: "textarea",
          title: "Textarea 多行输入",
          description:
            "多行文本输入控件。支持自动增高、字符计数和尺寸调节。与 Input 共享验证状态和标签模式。",
          metaTags: ["自动增高", "字符计数", "可调节"],
          demos: [
            {
              title: "基础 & 自动增高",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><textarea class="txa" rows="3" placeholder="固定高度，3 行"></textarea><textarea class="txa txa-auto" rows="1" placeholder="自动增高——随内容撑开"></textarea></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "复制",
                copiedLabel: "已复制",
                code: `<textarea class="txa" rows="3" placeholder="固定高度，3 行"></textarea>
<textarea class="txa txa-auto" rows="1" placeholder="自动增高——随内容撑开"></textarea>`,
              },
            },
            {
              title: "字符计数 & 验证",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><div class="field"><label class="field-label">备注</label><textarea class="txa" rows="3" maxlength="200" placeholder="最多 200 字符"></textarea><span class="field-hint field-counter">0 / 200</span></div><div class="field"><label class="field-label">错误示例</label><textarea class="txa txa-error" rows="2">内容超出限制</textarea><span class="field-error">已超出最大字符数</span></div></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "复制",
                copiedLabel: "已复制",
                code: `<div class="field">
  <label class="field-label">备注</label>
  <textarea class="txa" rows="3" maxlength="200" placeholder="最多 200 字符"></textarea>
  <span class="field-hint field-counter">0 / 200</span>
</div>

<div class="field">
  <label class="field-label">错误示例</label>
  <textarea class="txa txa-error" rows="2">内容超出限制</textarea>
  <span class="field-error">已超出最大字符数</span>
</div>`,
              },
            },
          ],
          table: {
            columns: ["属性", "类名 / 值", "说明"],
            rows: [
              ["基础", ".txa", "多行输入基础类"],
              ["自动增高", ".txa-auto", "内容增加时自动撑高"],
              ["错误态", ".txa-error", "红色边框反馈"],
              ["调节", "resize: vertical", "默认纵向可调"],
            ],
          },
          doTitle: "✓ 应当",
          doBody: "对有字数限制的输入显示实时计数器。长文本建议使用 txa-auto 提升输入体验。",
          dontTitle: "✗ 不应",
          dontBody: "不要设置 resize:none。rows 也不要低于 2，否则与 Input 无区别。",
        },
      ],
      selectionControls: [
        {
          id: "select",
          title: "Select 选择器",
          description:
            "单选下拉控件。原生 select 增强样式，保持键盘可访问性和移动端原生体验。复杂场景可替换为 Combobox。",
          metaTags: ["3 尺寸", "分组", "禁用项"],
          demos: [
            { title: "基础 & 尺寸", exampleId: "select.base-sizes" },
            { title: "分组 & 禁用", exampleId: "select.groups-disabled" },
          ],
          table: {
            columns: ["属性", "类名 / 值", "说明"],
            rows: [
              ["尺寸", ".sel-sm / 默认 / .sel-lg", "28px / 36px / 44px 高度"],
              ["错误态", ".sel-error", "红色边框，表示未选择必选项"],
              ["禁用", "disabled", "灰色背景，阻止交互"],
              ["分组", "<optgroup>", "原生分组，可嵌套使用"],
            ],
          },
          doTitle: "✓ 应当",
          doBody:
            '选项不超过 15 个时使用 Select。第一项为空值占位（"请选择…"）以暗示未选状态。分组清晰地组织相关选项。',
          dontTitle: "✗ 不应",
          dontBody: "选项超过 15 个应改用 Combobox。不要用 Select 做多选。",
        },
        {
          id: "checkbox",
          title: "Checkbox 复选框",
          description: "多选切换控件。支持选中、未选中、半选三态。常用于设置面板和批量操作场景。",
          metaTags: ["3 状态", "2 尺寸", "组合使用"],
          demos: [
            { title: "状态", exampleId: "checkbox.states" },
            { title: "组合使用", exampleId: "checkbox.grouped" },
          ],
          table: {
            columns: ["属性", "类名 / 值", "说明"],
            rows: [
              ["基础", ".chk", "复选框容器（label 包裹）"],
              ["选框", ".chk-box", "自定义选框视觉元素"],
              ["半选", ".chk-indeterminate", "全选/部分选中时的中间态"],
              ["禁用", "disabled on input", "降低透明度，阻止交互"],
            ],
          },
          doTitle: "✓ 应当",
          doBody: "列表项超过 5 个时提供“全选”复选框。label 必须描述操作结果而非状态。",
          dontTitle: "✗ 不应",
          dontBody: "不要用 Checkbox 做二选一切换，也不要在复选框组里混入其他表单控件。",
        },
        {
          id: "switch",
          title: "Switch 开关",
          description: "二态切换控件。操作即时生效，无需额外提交。适用于设置面板中的开关类选项。",
          metaTags: ["2 尺寸", "即时生效", "带标签"],
          demos: [
            { title: "状态 & 尺寸", exampleId: "switch.states-sizes" },
            { title: "设置面板场景", exampleId: "switch.settings-panel" },
          ],
          table: {
            columns: ["属性", "类名 / 值", "说明"],
            rows: [
              ["基础", ".swi", "开关容器（label 包裹）"],
              ["轨道", ".swi-track", "滑动轨道视觉元素"],
              ["小尺寸", ".swi-sm", "紧凑尺寸，用于密集列表"],
              ["禁用", "disabled on input", "降低透明度，阻止交互"],
            ],
          },
          doTitle: "✓ 应当",
          doBody: "Switch 仅用于即时生效的二选一操作。文字 label 放左侧，Switch 右侧对齐。",
          dontTitle: "✗ 不应",
          dontBody: "需要“保存”才生效的选项用 Checkbox 而非 Switch。不要用 Switch 做多选。",
        },
        {
          id: "radio",
          title: "Radio 单选框",
          description: "互斥选择控件。同组内只能选中一项。适用于选项较少且需可见所有选项的场景。",
          metaTags: ["互斥", "分组", "横向/纵向"],
          demos: [
            { title: "纵向排列", exampleId: "radio.vertical" },
            { title: "横向排列 & 禁用", exampleId: "radio.horizontal-disabled" },
          ],
          table: {
            columns: ["属性", "类名 / 值", "说明"],
            rows: [
              ["基础", ".rad", "单选框容器（label 包裹）"],
              ["圆点", ".rad-dot", "自定义圆形选中指示器"],
              ["分组", "name 属性相同", "浏览器自动互斥"],
              ["禁用", "disabled on input", "降低透明度，阻止交互"],
            ],
          },
          doTitle: "✓ 应当",
          doBody: "2-5 个选项时使用 Radio 使所有选项可见。提供一个默认选中项。",
          dontTitle: "✗ 不应",
          dontBody: "超过 5 个选项改用 Select 或 Combobox。不要把 Radio 和 Checkbox 混用。",
        },
      ],
    },
  },
  en: {
    sidebarTitle: "Tabora Docs",
    sidebarGroups: [
      {
        title: "Getting started",
        items: [
          { id: "quickstart", label: "Quick start" },
          { id: "manifest", label: "Manifest" },
          { id: "runtime", label: "Runtime API" },
          { id: "contributions", label: "Contribution types" },
          { id: "tokens", label: "Design tokens" },
        ],
      },
      {
        title: "Inputs",
        items: [
          { id: "button", label: "Button" },
          { id: "input", label: "Input" },
          { id: "textarea", label: "Textarea" },
        ],
      },
      {
        title: "Selection controls",
        items: [
          { id: "select", label: "Select" },
          { id: "checkbox", label: "Checkbox" },
          { id: "switch", label: "Switch" },
          { id: "radio", label: "Radio" },
        ],
      },
      {
        title: "Overlays and menus",
        items: [
          { id: "tabs", label: "Tabs" },
          { id: "dialog", label: "Dialog" },
          { id: "drawer", label: "Drawer" },
          { id: "tooltip", label: "Tooltip" },
        ],
      },
      {
        title: "Feedback",
        items: [
          { id: "toast", label: "Toast" },
          { id: "progress", label: "Spinner / Progress" },
          { id: "skeleton", label: "Skeleton" },
          { id: "empty", label: "Empty state" },
        ],
      },
      {
        title: "Labels and layout",
        items: [
          { id: "badge", label: "Badge" },
          { id: "table", label: "Table" },
          { id: "card", label: "Card" },
        ],
      },
    ],
    sections: {
      quickstart: {
        eyebrow: "QUICKSTART",
        title: "Create your first Tabora plugin in three steps",
        description:
          "The Tabora plugin folder stays minimal: the manifest declares contributions, component files only render the plugin content area, and host capabilities are requested through runtime context instead of direct DOM control.",
        demos: [
          {
            title: "1 — Create the folder structure",
            codeBlock: {
              label: "terminal",
              copyLabel: "Copy",
              copiedLabel: "Copied",
              copyId: "qs-cmd",
              code: `mkdir plugins/today-focus
cd plugins/today-focus
touch tabora.plugin.json TodayFocusWidget.tsx`,
            },
          },
          {
            title: "2 — Folder structure",
            treeBlock: {
              label: "file tree",
              code: `plugins/today-focus/
├── tabora.plugin.json      # plugin manifest
├── TodayFocusWidget.tsx    # widget entry component
├── TodayFocusSettings.tsx  # settings panel (optional)
└── assets/                 # private assets (optional)`,
            },
          },
          {
            title: "3 — Minimal manifest",
            codeBlock: {
              label: "tabora.plugin.json",
              copyLabel: "Copy",
              copiedLabel: "Copied",
              copyId: "qs-manifest",
              code: `{
  "id": "official.widgets.today-focus",
  "name": "Today Focus",
  "version": "1.0.0",
  "contributions": {
    "widgets": [{ "id": "today-focus", "title": "Today Focus", "entry": "./TodayFocusWidget.tsx", "sizes": ["medium", "large"] }]
  },
  "permissions": ["storage:read", "storage:write"]
}`,
            },
          },
        ],
      },
      manifest: {
        eyebrow: "MANIFEST",
        title: "Manifest describes capabilities, not host implementation",
        description:
          "All contribution points are declared through the contributions field. Plugins cannot create global containers directly and must request host capabilities from runtime.",
        anatomyTitle: "Field structure",
        anatomyItems: [
          "id — globally unique, formatted as namespace.category.name",
          "name — user-facing display name",
          "version — follows semver for host update decisions",
          "contributions — declares widgets / layouts / searchProviders / settingsPanels",
          "permissions — required host permissions that can be revoked in settings",
        ],
        codeBlock: {
          label: "Full manifest example",
          copyLabel: "Copy",
          copiedLabel: "Copied",
          copyId: "manifest-full",
          code: `{
  "id": "official.widgets.today-focus",
  "name": "Today Focus",
  "version": "1.0.0",
  "contributions": {
    "widgets": [
      {
        "id": "today-focus",
        "title": "Today Focus",
        "entry": "./TodayFocusWidget.tsx",
        "sizes": ["medium", "large"],
        "settingsPanel": "today-focus-settings"
      }
    ],
    "settingsPanels": [
      {
        "id": "today-focus-settings",
        "title": "Today Focus settings",
        "entry": "./TodayFocusSettings.tsx"
      }
    ]
  },
  "permissions": ["storage:read", "storage:write"]
}`,
        },
        table: {
          columns: ["Field", "Type", "Required", "Description"],
          rows: [
            ["id", "string", "✓", "Globally unique identifier, preferably three-part naming"],
            ["name", "string", "✓", "User-visible name, under 32 characters"],
            ["version", "string", "✓", "Semver format: 1.0.0"],
            [
              "contributions",
              "object",
              "✓",
              "Contribution declaration object with at least one child field",
            ],
            ["permissions", "string[]", "—", "Requested permissions, empty array by default"],
            ["description", "string", "—", "Plugin description shown in settings or marketplace"],
          ],
        },
      },
      runtime: {
        eyebrow: "RUNTIME API",
        title: "Plugins use host capabilities through runtime context",
        description:
          "Each contribution entry component receives a runtime prop that exposes storage, external links, toast, and global host state.",
        demos: [
          {
            title: "Widget example",
            codeBlock: {
              label: "TodayFocusWidget.tsx",
              copyLabel: "Copy",
              copiedLabel: "Copied",
              copyId: "rt-widget",
              code: `export function TodayFocusWidget({ runtime }) {
  const tasks = runtime.storage.useList("tasks")

  return (
    <CardSection title="Today focus">
      {tasks.map((task) => (
        <ListRow key={task.id} title={task.title}>
          <Checkbox checked={task.done} onCheckedChange={(v) => runtime.storage.update(task.id, { done: v })} />
        </ListRow>
      ))}
      <Button variant="secondary" size="sm" onClick={() => runtime.toast.show({ title: "Added" })}>
        Add task
      </Button>
    </CardSection>
  )
}`,
            },
          },
          {
            title: "Search Provider example",
            codeBlock: {
              label: "githubProvider.ts",
              copyLabel: "Copy",
              copiedLabel: "Copied",
              copyId: "rt-search",
              code: `export const githubProvider = {
  id: "github",
  label: "GitHub",
  prefix: "@github",
  async query(input: string, runtime) {
    if (!input.trim()) return []
    const url = \`https://github.com/search?q=\${encodeURIComponent(input)}\`
    return [{
      id: "github-search",
      title: input,
      subtitle: "Search on GitHub",
      action: () => runtime.external.open(url)
    }]
  }
}`,
            },
          },
          {
            title: "Settings Panel example",
            codeBlock: {
              label: "TodayFocusSettings.tsx",
              copyLabel: "Copy",
              copiedLabel: "Copied",
              copyId: "rt-settings",
              code: `export function TodayFocusSettings({ runtime }) {
  const compact = runtime.settings.useBoolean("compact", false)
  const maxItems = runtime.settings.useNumber("maxItems", 5)

  return (
    <>
      <Field label="Compact mode" description="Reduce card padding for smaller widget sizes.">
        <Switch checked={compact.value} onCheckedChange={compact.set} />
      </Field>
      <Field label="Maximum visible items">
        <Select value={maxItems.value.toString()} onValueChange={(v) => maxItems.set(Number(v))}>
          <SelectItem value="3">3 items</SelectItem>
          <SelectItem value="5">5 items</SelectItem>
          <SelectItem value="10">10 items</SelectItem>
        </Select>
      </Field>
    </>
  )
}`,
            },
          },
        ],
        table: {
          columns: ["runtime namespace", "Description", "Common methods"],
          rows: [
            [
              "runtime.storage",
              "Persistent key-value and list storage",
              "useList, get, set, update, remove",
            ],
            ["runtime.toast", "Trigger host-level toast", "show({ title, variant })"],
            ["runtime.external", "Open external links safely", "open(url)"],
            [
              "runtime.settings",
              "Persist plugin-level settings",
              "useBoolean, useString, useNumber",
            ],
            ["runtime.theme", "Read current theme state", "useColorScheme()"],
          ],
        },
      },
      contributions: {
        eyebrow: "CONTRIBUTION TYPES",
        title: "Four contribution types cover the visible workbench experience",
        description:
          "Each contribution type is declared through the manifest's contributions field. The host discovers and mounts them at startup.",
        table: {
          columns: ["Contribution", "Field", "Usage", "Size constraint"],
          rows: [
            ["Widget", "widgets", "Workbench card content", "small / medium / large"],
            [
              "Layout",
              "layouts",
              "Custom overall layout scheme",
              "Fullscreen, shell-managed container",
            ],
            [
              "Search Provider",
              "searchProviders",
              "Custom search source",
              "Dropdown rendered by the host",
            ],
            [
              "Settings Panel",
              "settingsPanels",
              "Plugin-specific settings UI",
              "Inside host modal",
            ],
          ],
        },
        doTitle: "✓ Do",
        doBody:
          "Each contribution type should only own content logic, not the surrounding shell. Widgets focus on card DOM and layouts focus on slot arrangement.",
        dontTitle: "✗ Don't",
        dontBody:
          "Do not create global modals or standalone toasts inside widgets. Use runtime.toast and host-provided containers to avoid z-index conflicts.",
      },
      tokens: {
        eyebrow: "DESIGN TOKENS",
        title: "Refined Sage V2.3 — CSS custom properties",
        description:
          "All components consume design tokens through CSS variables. Dark mode is switched by the .dark class, and plugin content inherits host tokens automatically.",
        previewTitle: "Color token preview",
        swatches: [
          {
            name: "--cp-accent",
            style:
              "padding: 10px 12px; background: var(--cp-accent); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
          },
          {
            name: "--cp-accent-soft",
            style:
              "padding: 10px 12px; background: var(--cp-accent-soft); color: var(--cp-accent); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-surface",
            style:
              "padding: 10px 12px; background: var(--cp-surface); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-surface-soft",
            style:
              "padding: 10px 12px; background: var(--cp-surface-soft); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-surface-hover",
            style:
              "padding: 10px 12px; background: var(--cp-surface-hover); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-page",
            style:
              "padding: 10px 12px; background: var(--cp-page); color: var(--cp-text); border-radius: 8px; font-size: 12px; font-weight: 600; border: 1px solid var(--cp-line);",
          },
          {
            name: "--cp-danger",
            style:
              "padding: 10px 12px; background: var(--cp-danger); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
          },
          {
            name: "--cp-success",
            style:
              "padding: 10px 12px; background: var(--cp-success); color: #fff; border-radius: 8px; font-size: 12px; font-weight: 600;",
          },
        ],
        table: {
          columns: ["Token", "Light", "Dark", "Usage"],
          rows: [
            [
              "--cp-accent",
              "#1a9070",
              "#34d19e",
              "Primary accent for buttons, links, and focus rings",
            ],
            ["--cp-accent-soft", "#eaf5f0", "#1a2e26", "Soft accent background, selected chips"],
            ["--cp-surface", "#ffffff", "#252927", "Cards, inputs, and overlays"],
            ["--cp-text", "#1c1e1c", "#edf0ed", "Primary text color"],
            ["--cp-text-muted", "#6b6e6a", "#b6bab6", "Secondary text and placeholders"],
            ["--cp-line", "#e6e8e3", "#3b403c", "Dividers and borders"],
            ["--cp-danger", "#c94545", "#ef8b8b", "Danger and error state"],
            ["--cp-radius-control", "8px", "8px", "Control radius for buttons and inputs"],
          ],
        },
      },
    },
    componentSpecs: {
      inputControls: [
        {
          id: "button",
          title: "Button",
          description:
            "Primary action trigger. Six variants, three sizes, and clear action hierarchy. In plugin content, prefer primary and secondary, while dangerous actions must be paired with a confirmation dialog.",
          metaTags: ["6 variants", "3 sizes", "Button group", "Icon button"],
          anatomyTitle: "Anatomy",
          anatomyItems: [
            ".btn — base class required by every variant",
            ".btn-{variant} — primary / secondary / subtle / ghost / danger / danger-subtle",
            ".btn-{size} — sm (28px) / md (36px) / lg (44px)",
            ".btn-full — stretches to parent width",
            ".btn-group — wraps and visually connects buttons",
          ],
          demos: [
            { title: "Variants", exampleId: "button.variants" },
            { title: "Sizes", exampleId: "button.sizes" },
            { title: "Disabled & full width", exampleId: "button.disabled-full" },
            { title: "Button group & icon button", exampleId: "button.group-icon" },
          ],
          table: {
            columns: ["Variant", "Background", "Text", "Use case"],
            rows: [
              [
                ".btn-primary",
                "--cp-accent",
                "#fff",
                "The single most important action on a screen",
              ],
              [
                ".btn-secondary",
                "--cp-surface",
                "--cp-text",
                "Secondary actions, cancel, navigation",
              ],
              [
                ".btn-subtle",
                "--cp-accent-soft",
                "--cp-accent",
                "Low-emphasis toolbar and filter actions",
              ],
              [
                ".btn-ghost",
                "transparent",
                "--cp-text-muted",
                "Inline helpers and card-level utilities",
              ],
              [
                ".btn-danger",
                "--cp-danger",
                "#fff",
                "Irreversible destructive actions with confirmation",
              ],
              [
                ".btn-danger-subtle",
                "--cp-danger-soft",
                "--cp-danger",
                "Lower-intensity danger state",
              ],
            ],
          },
          doTitle: "✓ Do",
          doBody:
            "Keep at most one primary button per functional area. Use secondary or ghost for supporting actions so hierarchy stays clear.",
          dontTitle: "✗ Don't",
          dontBody:
            "Do not place multiple primary buttons in the same row. Danger actions must not be the first step without confirmation.",
          pluginExample: {
            label: "Plugin usage example",
            copyLabel: "Copy",
            copiedLabel: "Copied",
            copyId: "btn-code",
            code: `// Basic usage
<Button variant="primary">Confirm</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost" size="sm">View details</Button>

// Dangerous action with Dialog
<Button variant="danger" onClick={() => setConfirmOpen(true)}>Delete record</Button>

// Full width
<Button variant="primary" fullWidth>Start sync</Button>`,
          },
        },
        {
          id: "input",
          title: "Input",
          description:
            "Single-line text input. Supports three sizes, prefix and suffix slots, and four validation states. All input controls share the same radius and border tokens.",
          metaTags: ["3 sizes", "4 states", "Prefix / suffix", "Clearable"],
          demos: [
            {
              title: "Sizes",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><input class="ipt ipt-sm" placeholder="Small — 28px height" /><input class="ipt" placeholder="Medium — 36px height" /><input class="ipt ipt-lg" placeholder="Large — 44px height" /></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "Copy",
                copiedLabel: "Copied",
                code: `<input class="ipt ipt-sm" placeholder="Small — 28px height" />
<input class="ipt" placeholder="Medium — 36px height" />
<input class="ipt ipt-lg" placeholder="Large — 44px height" />`,
              },
            },
            {
              title: "States",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><input class="ipt" placeholder="Default state" /><input class="ipt ipt-success" value="Valid" /><input class="ipt ipt-error" value="Invalid" /><input class="ipt" disabled value="Disabled" /></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "Copy",
                copiedLabel: "Copied",
                code: `<input class="ipt" placeholder="Default state" />
<input class="ipt ipt-success" value="Valid" />
<input class="ipt ipt-error" value="Invalid" />
<input class="ipt" disabled value="Disabled" />`,
              },
            },
            {
              title: "Prefix, suffix & clearable",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><div class="ipt-wrap"><span class="ipt-prefix">🔍</span><input class="ipt" placeholder="Search plugins..." /></div><div class="ipt-wrap"><input class="ipt" placeholder="Enter tag" /><span class="ipt-suffix">⏎</span></div><div class="ipt-wrap"><input class="ipt" value="Clearable content" /><button class="ipt-clear" type="button">✕</button></div></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "Copy",
                copiedLabel: "Copied",
                code: `<!-- Prefix -->
<div class="ipt-wrap">
  <span class="ipt-prefix">🔍</span>
  <input class="ipt" placeholder="Search plugins..." />
</div>

<!-- Suffix -->
<div class="ipt-wrap">
  <input class="ipt" placeholder="Enter tag" />
  <span class="ipt-suffix">⏎</span>
</div>

<!-- Clearable -->
<div class="ipt-wrap">
  <input class="ipt" value="Clearable content" />
  <button class="ipt-clear" type="button">✕</button>
</div>`,
              },
            },
            {
              title: "Label & hint",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 16px"><div class="field"><label class="field-label">Username <span class="field-required">*</span></label><input class="ipt" placeholder="Enter username" /><span class="field-hint">3-20 characters, letters and numbers only</span></div><div class="field"><label class="field-label">Description</label><input class="ipt ipt-error" value="Too long" /><span class="field-error">Exceeds the 100 character limit</span></div></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "Copy",
                copiedLabel: "Copied",
                code: `<div class="field">
  <label class="field-label">Username <span class="field-required">*</span></label>
  <input class="ipt" placeholder="Enter username" />
  <span class="field-hint">3-20 characters, letters and numbers only</span>
</div>

<div class="field">
  <label class="field-label">Description</label>
  <input class="ipt ipt-error" value="Too long" />
  <span class="field-error">Exceeds the 100 character limit</span>
</div>`,
              },
            },
          ],
          table: {
            columns: ["Property", "Class / value", "Description"],
            rows: [
              ["Size", ".ipt-sm / default / .ipt-lg", "28px / 36px / 44px height"],
              ["Validation", ".ipt-success / .ipt-error", "Green or red border feedback"],
              ["Disabled", "disabled", "Reduces opacity and blocks interaction"],
              ["Wrapper", ".ipt-wrap", "Container for prefix and suffix positioning"],
              ["Prefix", ".ipt-prefix", "Icon or text on the left side"],
              ["Suffix", ".ipt-suffix", "Icon or text on the right side"],
              ["Clear", ".ipt-clear", "Clear button shown when the input has content"],
            ],
          },
          doTitle: "✓ Do",
          doBody:
            "Always provide a placeholder that hints at the expected format. Error states must show field-error text, and form inputs must be paired with a label.",
          dontTitle: "✗ Don't",
          dontBody:
            "Do not use title as a label replacement, and do not hide essential guidance only inside placeholders.",
        },
        {
          id: "textarea",
          title: "Textarea",
          description:
            "Multiline text input. Supports auto-grow, character counting, and resizing. Shares validation and labeling patterns with Input.",
          metaTags: ["Auto grow", "Counter", "Resizable"],
          demos: [
            {
              title: "Base & auto grow",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><textarea class="txa" rows="3" placeholder="Fixed height, 3 rows"></textarea><textarea class="txa txa-auto" rows="1" placeholder="Auto grow with content"></textarea></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "Copy",
                copiedLabel: "Copied",
                code: `<textarea class="txa" rows="3" placeholder="Fixed height, 3 rows"></textarea>
<textarea class="txa txa-auto" rows="1" placeholder="Auto grow with content"></textarea>`,
              },
            },
            {
              title: "Counter & validation",
              previewHtml:
                '<div class="demo-row" style="flex-direction: column; gap: 12px"><div class="field"><label class="field-label">Notes</label><textarea class="txa" rows="3" maxlength="200" placeholder="Up to 200 characters"></textarea><span class="field-hint field-counter">0 / 200</span></div><div class="field"><label class="field-label">Error example</label><textarea class="txa txa-error" rows="2">Content exceeds the limit</textarea><span class="field-error">Character limit exceeded</span></div></div>',
              codeBlock: {
                label: "HTML",
                copyLabel: "Copy",
                copiedLabel: "Copied",
                code: `<div class="field">
  <label class="field-label">Notes</label>
  <textarea class="txa" rows="3" maxlength="200" placeholder="Up to 200 characters"></textarea>
  <span class="field-hint field-counter">0 / 200</span>
</div>

<div class="field">
  <label class="field-label">Error example</label>
  <textarea class="txa txa-error" rows="2">Content exceeds the limit</textarea>
  <span class="field-error">Character limit exceeded</span>
</div>`,
              },
            },
          ],
          table: {
            columns: ["Property", "Class / value", "Description"],
            rows: [
              ["Base", ".txa", "Base multiline input class"],
              ["Auto grow", ".txa-auto", "Grows with content"],
              ["Error state", ".txa-error", "Red border feedback"],
              ["Resize", "resize: vertical", "Vertically resizable by default"],
            ],
          },
          doTitle: "✓ Do",
          doBody:
            "Show a live counter when the content has limits, and prefer txa-auto for longer input flows.",
          dontTitle: "✗ Don't",
          dontBody:
            "Do not disable resizing, and avoid rows below 2 because it collapses into an Input-like control.",
        },
      ],
      selectionControls: [
        {
          id: "select",
          title: "Select",
          description:
            "Single-choice dropdown. Styled on top of native select to preserve keyboard accessibility and mobile-native behavior. Replace with Combobox for complex cases.",
          metaTags: ["3 sizes", "Grouped", "Disabled option"],
          demos: [
            { title: "Base & sizes", exampleId: "select.base-sizes" },
            { title: "Groups & disabled", exampleId: "select.groups-disabled" },
          ],
          table: {
            columns: ["Property", "Class / value", "Description"],
            rows: [
              ["Size", ".sel-sm / default / .sel-lg", "28px / 36px / 44px height"],
              ["Error", ".sel-error", "Red border for required-but-missing state"],
              ["Disabled", "disabled", "Muted background and blocked interaction"],
              ["Grouping", "<optgroup>", "Native grouping with nested options"],
            ],
          },
          doTitle: "✓ Do",
          doBody:
            "Use Select when options stay under 15. Keep the first option as an empty placeholder and group related choices clearly.",
          dontTitle: "✗ Don't",
          dontBody:
            "Switch to Combobox when options exceed 15, and never use Select for multi-select.",
        },
        {
          id: "checkbox",
          title: "Checkbox",
          description:
            "Multi-select toggle. Supports checked, unchecked, and indeterminate states. Useful in settings panels and bulk operations.",
          metaTags: ["3 states", "2 sizes", "Grouped use"],
          demos: [
            { title: "States", exampleId: "checkbox.states" },
            { title: "Grouped usage", exampleId: "checkbox.grouped" },
          ],
          table: {
            columns: ["Property", "Class / value", "Description"],
            rows: [
              ["Base", ".chk", "Checkbox container wrapped by label"],
              ["Box", ".chk-box", "Custom checkbox visual element"],
              ["Indeterminate", ".chk-indeterminate", "Middle state for partial selection"],
              ["Disabled", "disabled on input", "Reduced opacity and blocked interaction"],
            ],
          },
          doTitle: "✓ Do",
          doBody:
            'Offer a "select all" checkbox when the list grows, and write labels around user intent rather than status.',
          dontTitle: "✗ Don't",
          dontBody:
            "Do not use Checkbox for binary toggles and do not mix unrelated form controls into one checkbox group.",
        },
        {
          id: "switch",
          title: "Switch",
          description:
            "Binary toggle that takes effect immediately. Best for settings-panel toggles that do not require an explicit save action.",
          metaTags: ["2 sizes", "Immediate", "With labels"],
          demos: [
            { title: "States & sizes", exampleId: "switch.states-sizes" },
            { title: "Settings panel example", exampleId: "switch.settings-panel" },
          ],
          table: {
            columns: ["Property", "Class / value", "Description"],
            rows: [
              ["Base", ".swi", "Switch container wrapped by label"],
              ["Track", ".swi-track", "Track visual element"],
              ["Small", ".swi-sm", "Compact size for dense lists"],
              ["Disabled", "disabled on input", "Reduced opacity and blocked interaction"],
            ],
          },
          doTitle: "✓ Do",
          doBody:
            "Use Switch only for immediate binary toggles. Keep the label on the left and the control aligned on the right.",
          dontTitle: "✗ Don't",
          dontBody:
            "Use Checkbox instead when the change should wait for Save, and never use one Switch row to represent multi-select.",
        },
        {
          id: "radio",
          title: "Radio",
          description:
            "Mutually exclusive options. Best when the set stays small and all choices should remain visible at once.",
          metaTags: ["Mutually exclusive", "Grouped", "Horizontal / vertical"],
          demos: [
            { title: "Vertical layout", exampleId: "radio.vertical" },
            { title: "Horizontal & disabled", exampleId: "radio.horizontal-disabled" },
          ],
          table: {
            columns: ["Property", "Class / value", "Description"],
            rows: [
              ["Base", ".rad", "Radio container wrapped by label"],
              ["Dot", ".rad-dot", "Custom circular indicator"],
              ["Grouping", "same name attribute", "Browser-managed mutual exclusion"],
              ["Disabled", "disabled on input", "Reduced opacity and blocked interaction"],
            ],
          },
          doTitle: "✓ Do",
          doBody:
            "Use Radio when there are only a few options and give the group a sensible default selection.",
          dontTitle: "✗ Don't",
          dontBody:
            "Switch to Select or Combobox when the list gets longer, and do not mix Radio with Checkbox semantics.",
        },
      ],
    },
  },
}

export function getDocsPageContent(locale: SiteLocale): DocsPageContent {
  return docsPageContent[locale]
}
