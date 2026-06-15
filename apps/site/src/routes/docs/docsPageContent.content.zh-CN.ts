import type { DocsPageContent } from "./docsPageContent.types"

export const zhCNDocsPageContent: DocsPageContent = {
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
        demos: [{ title: "示例", exampleId: "button" }],
        table: {
          columns: ["变体", "背景", "文字色", "适用场景"],
          rows: [
            [".btn-primary", "--cp-accent", "#fff", "每屏唯一最重要操作"],
            [".btn-secondary", "--cp-surface", "--cp-text", "次级操作、取消、导航"],
            [".btn-subtle", "--cp-accent-soft", "--cp-accent", "工具栏、筛选区低权重操作"],
            [".btn-ghost", "transparent", "--cp-text-muted", "内联操作、卡片内辅助按钮"],
            [".btn-danger", "--cp-danger", "#fff", "不可逆破坏操作，需二次确认"],
            [".btn-danger-subtle", "--cp-danger-soft", "--cp-danger", "危险低强度版本，可直接展示"],
          ],
        },
        doTitle: "✓ 应当",
        doBody:
          "每个功能区最多一个 primary 按钮。用 secondary 或 ghost 做辅助操作，保持视觉层级清晰。",
        dontTitle: "✗ 不应",
        dontBody: "不要在同一行放多个 primary 按钮。danger 操作不能是第一步，必须搭配确认 Dialog。",
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
        demos: [{ title: "示例", exampleId: "input" }],
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
        demos: [{ title: "示例", exampleId: "textarea" }],
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
        demos: [{ title: "示例", exampleId: "select" }],
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
        demos: [{ title: "示例", exampleId: "checkbox" }],
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
        demos: [{ title: "示例", exampleId: "switch" }],
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
        demos: [{ title: "示例", exampleId: "radio" }],
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
    overlayControls: [
      {
        id: "tabs",
        title: "Tabs 标签页",
        description: "内容分区导航。在同一视图内切换不同面板，适合设置分区和插件详情等并列内容。",
        metaTags: ["线性风格", "胶囊风格", "可滚动", "图标"],
        demos: [{ title: "示例", exampleId: "tabs" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["容器", ".tbr-tabs", "Kobalte Tabs 根容器"],
            ["列表", ".tbr-tabs-list", "标签栏容器，横向排列并支持溢出滚动"],
            ["单项", ".tbr-tabs-trigger", "单个标签按钮"],
            ["激活", "data-selected", "当前选中标签"],
            ["胶囊", 'variant="pills"', "圆角胶囊风格变体"],
            ["徽标", 'Badge variant="counter"', "标签内计数徽标"],
            ["禁用", "disabled: true", "不可点击的标签"],
          ],
        },
        doTitle: "✓ 应当",
        doBody: "标签数量控制在 2-6 个，当前激活项必须有清晰区分，内容切换不应造成布局跳动。",
        dontTitle: "✗ 不应",
        dontBody: "不要嵌套 Tabs，也不要把 Tabs 当全局导航；懒加载内容时要有骨架屏反馈。",
      },
      {
        id: "dialog",
        title: "Dialog 对话框",
        description: "模态浮层。用于关键确认或短表单，阻断主流程并聚焦用户当前决策。",
        metaTags: ["3 尺寸", "确认型", "表单型", "危险型"],
        demos: [{ title: "示例", exampleId: "dialog" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["遮罩", ".dialog-overlay", "半透明背景层"],
            ["容器", ".dialog", "居中面板"],
            ["小尺寸", ".dialog-sm", "max-width: 360px，适合简短确认"],
            ["中尺寸", "默认", "max-width: 480px，适合表单"],
            ["大尺寸", ".dialog-lg", "max-width: 640px，适合复杂内容"],
            ["关闭", "ESC / 遮罩点击 / 关闭按钮", "三种关闭方式并存"],
          ],
        },
        doTitle: "✓ 应当",
        doBody:
          "危险操作必须二次确认；提交成功后关闭 Dialog 并用 Toast 反馈；焦点需要锁定在对话框内。",
        dontTitle: "✗ 不应",
        dontBody:
          "不要嵌套 Dialog。内容超过一屏时应改用 Drawer 或独立页面，不要在 Dialog 中塞导航。",
      },
      {
        id: "drawer",
        title: "Drawer 抽屉",
        description: "侧滑浮层面板。在不离开当前页面的前提下展示更多详情或编辑表单。",
        metaTags: ["右侧滑入", "可嵌套表单", "遮罩关闭"],
        demos: [{ title: "示例", exampleId: "drawer" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["遮罩", ".drawer-overlay", "半透明背景，点击关闭"],
            ["面板", ".drawer", "右侧滑入面板，默认 360px 宽"],
            ["头部", ".drawer-head", "标题和关闭按钮"],
            ["主体", ".drawer-body", "可滚动内容区"],
            ["底部", ".drawer-foot", "固定操作按钮区"],
          ],
        },
        doTitle: "✓ 应当",
        doBody: "编辑类表单优先用 Drawer，底部操作按钮保持固定，并在关闭时检查未保存更改。",
        dontTitle: "✗ 不应",
        dontBody: "简单的 1-2 个字段不要升级成 Drawer，也不要在 Drawer 内再打开另一个 Drawer。",
      },
      {
        id: "tooltip",
        title: "Tooltip 工具提示",
        description: "悬停或聚焦时显示的简短说明，适合图标按钮、截断文字和紧凑控件补充信息。",
        metaTags: ["4 方向", "延迟显示", "非交互"],
        demos: [{ title: "示例", exampleId: "tooltip" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["容器", ".tip-wrap", "position: relative 包裹层"],
            ["提示", ".tip", "hover / focus 时显示"],
            ["上 / 下 / 左 / 右", ".tip-top / .tip-bottom / .tip-left / .tip-right", "气泡方向"],
            ["延迟", "300ms", "避免闪烁"],
          ],
        },
        doTitle: "✓ 应当",
        doBody: "所有纯图标按钮都应提供 Tooltip，内容控制在一行内，触摸设备至少保留 aria-label。",
        dontTitle: "✗ 不应",
        dontBody: "不要在 Tooltip 中放可交互内容；已有可见文字标签的按钮通常不需要再加 Tooltip。",
      },
    ],
    feedbackControls: [
      {
        id: "toast",
        title: "Toast 轻提示",
        description: "非阻断性反馈。短暂出现后自动消失，用于操作结果通知，不打断主流程。",
        metaTags: ["4 变体", "自动消失", "可关闭", "可堆叠"],
        demos: [{ title: "示例", exampleId: "toast" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["成功", ".toast-success", "绿色，操作成功反馈"],
            ["错误", ".toast-error", "红色，操作失败反馈"],
            ["警告", ".toast-warning", "橙色，需注意但非阻断"],
            ["信息", ".toast-info", "蓝色，中性通知"],
            ["时长", "3000ms（默认）", "success / info 约 3s，error / warning 更长"],
            ["位置", "视口右上角", "多条从上往下堆叠"],
          ],
        },
        doTitle: "✓ 应当",
        doBody:
          "操作成功或失败后立即给 Toast 反馈；可撤销操作应提供行动按钮；错误提示应适当延长显示时间。",
        dontTitle: "✗ 不应",
        dontBody: "不要用 Toast 承载长文本或复杂交互，同时显示的 Toast 数量也不要过多。",
      },
      {
        id: "progress",
        title: "Spinner / Progress 加载指示",
        description: "异步操作反馈。Spinner 用于不确定时长的加载，Progress 用于可量化进度。",
        metaTags: ["旋转动画", "进度条", "3 尺寸", "行内/全屏"],
        demos: [{ title: "示例", exampleId: "progress" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["旋转", ".spinner", "圆形旋转加载指示器"],
            ["尺寸", ".spinner-sm / 默认 / .spinner-lg", "16px / 24px / 32px"],
            ["进度容器", ".progress", "进度条背景轨道"],
            ["进度填充", ".progress-bar", "通过百分比控制宽度"],
            ["成功 / 错误", ".progress-bar-success / .progress-bar-danger", "完成或失败语义色"],
          ],
        },
        doTitle: "✓ 应当",
        doBody:
          "超过 200ms 的操作显示加载态；可量化进度时优先使用 Progress；按钮内加载要同时显示文字并禁用按钮。",
        dontTitle: "✗ 不应",
        dontBody:
          "已有骨架屏的区域不要再叠加 Spinner；Progress 到 100% 后应立即切换完成状态或消失。",
      },
      {
        id: "skeleton",
        title: "Skeleton 骨架屏",
        description:
          "数据到达前展示内容轮廓，减少感知等待时间，是首屏加载比 Spinner 更稳妥的方案。",
        metaTags: ["文本行", "圆形", "矩形", "动画"],
        demos: [{ title: "示例", exampleId: "skeleton" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["基础", ".skeleton", "灰色背景和脉冲动画"],
            ["文本", ".skeleton-text", "模拟文本行的圆角矩形"],
            ["矩形", ".skeleton-rect", "通用内容占位"],
            ["圆形", ".skeleton-circle", "头像或图标占位"],
            ["动画", "pulse", "opacity 呼吸变化"],
          ],
        },
        doTitle: "✓ 应当",
        doBody: "骨架形状尽量贴近真实内容布局，并让多行宽度有变化，避免所有占位看起来完全一样。",
        dontTitle: "✗ 不应",
        dontBody: "数据已经到达时不要闪烁显示骨架；小范围操作反馈应使用 Spinner，而不是骨架屏。",
      },
      {
        id: "empty",
        title: "Empty State 空状态",
        description: "列表、表格或内容区无数据时的占位提示，用来解释当前状态并引导用户下一步动作。",
        metaTags: ["引导操作", "插图", "自适应"],
        demos: [{ title: "示例", exampleId: "empty" }],
        table: {
          columns: ["元素", "必须", "说明"],
          rows: [
            ["插图 / 图标", "推荐", "48-64px 视觉元素，降低空白感"],
            ["标题", "必须", "简短说明当前状态"],
            ["描述", "推荐", "1 行引导文字，暗示解决方案"],
            ["操作按钮", "可选", "引导用户创建、添加或导入"],
          ],
        },
        doTitle: "✓ 应当",
        doBody: "提供明确的下一步操作，插图风格与产品保持一致，标题口吻统一且易于理解。",
        dontTitle: "✗ 不应",
        dontBody: "不要让空状态像 bug 或错误页，也不要省略占位导致用户面对一片空白。",
      },
    ],
    structureControls: [
      {
        id: "badge",
        title: "Badge 徽标",
        description: "状态标记和数字计数。用于标签页、列表项等位置展示额外信息，也支持 dot 模式。",
        metaTags: ["5 变体", "dot 模式", "计数"],
        demos: [{ title: "示例", exampleId: "badge" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["默认", ".badge-default", "灰色中性信息标记"],
            ["主要", ".badge-primary", "强调色，活跃或选中状态"],
            ["成功 / 警告 / 危险", ".badge-success / .badge-warning / .badge-danger", "语义状态色"],
            ["圆点", ".badge-dot", "无文字的小圆点指示器"],
          ],
        },
        doTitle: "✓ 应当",
        doBody: "数字超过 99 时显示 99+，dot 模式适合纯粹的有/无状态提示，颜色语义要全局一致。",
        dontTitle: "✗ 不应",
        dontBody: "不要在 Badge 中放长文本，也不要把 Badge 当按钮使用；同一行不要堆太多徽标。",
      },
      {
        id: "table",
        title: "Table 表格",
        description: "结构化数据展示，适用于插件列表、日志和管理后台一类数据密集场景。",
        metaTags: ["排序", "选择", "斑马纹", "响应式"],
        demos: [{ title: "示例", exampleId: "table" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["基础", ".tbl", "表格基础样式"],
            ["斑马纹", ".tbl-striped", "奇偶行交替背景"],
            ["悬停", ".tbl-hover", "行悬停高亮"],
            ["紧凑", ".tbl-compact", "减少 padding 的密集模式"],
            ["响应式", "外层 overflow-x: auto", "窄屏时允许横向滚动"],
          ],
        },
        doTitle: "✓ 应当",
        doBody: "按信息优先级分配列宽，长列表提供排序或筛选，操作列建议靠右对齐。",
        dontTitle: "✗ 不应",
        dontBody: "列数不要过多，不要在表格中嵌套表格，空数据时必须提供明确占位提示。",
      },
      {
        id: "card",
        title: "Card 卡片",
        description:
          "内容容器。将相关信息分组展示，支持头部、主体、底部三区域布局，是工作台的基础组织单元。",
        metaTags: ["3 区域", "可点击", "带阴影", "边框模式"],
        demos: [{ title: "示例", exampleId: "card" }],
        table: {
          columns: ["属性", "类名 / 值", "说明"],
          rows: [
            ["基础", ".card", "带边框和圆角的容器"],
            ["头部", ".card-head", "标题和操作区"],
            ["主体", ".card-body", "主内容区域"],
            ["底部", ".card-foot", "操作按钮区域"],
            ["可点击 / 选中", ".card-clickable / .card-selected", "交互态和选中态"],
          ],
        },
        doTitle: "✓ 应当",
        doBody: "卡片内操作尽量放到底部区域，可点击卡片提供 hover 反馈，内容区保持简洁聚焦。",
        dontTitle: "✗ 不应",
        dontBody: "不要在卡片中再嵌套卡片，同组卡片高度差异不要过大，也不要只靠阴影代替边框。",
      },
    ],
  },
}
