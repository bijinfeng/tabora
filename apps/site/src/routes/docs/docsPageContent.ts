import type { SiteLocale } from "../../app/AppShell"

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
  },
}

export function getDocsPageContent(locale: SiteLocale): DocsPageContent {
  return docsPageContent[locale]
}
