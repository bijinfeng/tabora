import type { SiteLocale } from "../../app/AppShell"

export const homePrototypeContent: Record<SiteLocale, any> = {
  "zh-CN": {
    hero: {
      title: "把新标签页变成插件装配的个人工作台。",
      lead: "Tabora 不把搜索、便签、待办和背景写死在平台里。布局、卡片、搜索源、主题和设置面板都通过插件协议贡献，用户看到的是完整工作台，平台保留的是运行边界。",
      primaryCta: "下载 Tabora",
      secondaryCta: "阅读文档",
      chips: ["布局也是插件", "本地优先 MVP", "组件库式文档"],
    },
    mock: {
      greeting: "下午好",
      date: "6 月 10 日",
      addCard: "+ 添加卡片",
      commandPlaceholder: "搜索网页、命令或卡片…",
      widgets: {
        focus: {
          title: "今日重点",
          sub: "focus · 多实例",
          body: "把默认新标签页做成可组合的个人工作入口",
        },
        links: {
          title: "快捷入口",
          sub: "links · 4 项",
          items: [
            ["PRD", "V2.2"],
            ["GitHub", "repo"],
            ["Linear", "tickets"],
            ["Figma", "tokens"],
          ],
        },
        weather: {
          title: "天气",
          sub: "weather · 北京",
          metric: "22°",
          meta: "晴 · 适合工作",
        },
        todo: {
          title: "待办",
          sub: "todo · 3 项",
          items: ["复核 widget 协议", "补齐搜索源切换", "清理设置后置项"],
        },
        notes: {
          title: "便签",
          sub: "notes · autosave",
          body: "MVP 重点：布局本身也是插件。平台只提供运行时、权限桥、持久化与安全回退。",
        },
        pluginStatus: {
          title: "插件状态",
          sub: "plugins",
          rows: [
            ["Widget", "6"],
            ["布局", "Dashboard"],
            ["搜索源", "Google"],
          ],
        },
      },
    },
    stats: [
      ["5+", "官方插件贡献点"],
      ["2", "布局范式 Dashboard & Focus"],
      ["52+", "基础组件和宿主组件"],
    ],
    featureHead: {
      title: "不是新标签页功能堆叠，而是可装配的工作台协议。",
      body: "产品评审最需要看到的不是更多卡片，而是：未来增加能力时，平台不会重新把业务逻辑写回核心。",
    },
    features: [
      [
        "布局本身也是插件",
        "Dashboard 和 Focus 是两种官方布局范式。布局决定区域和入口，不接管 widget 数据，也不改变卡片内容。",
      ],
      [
        "入口在任何布局下可达",
        "搜索、添加卡片、插件管理、设置和主题切换必须通过 rail、工具条、设置中心或命令面板保持可达。",
      ],
      [
        "失败被限制在局部",
        "Widget、设置面板、搜索插件或布局插件失败时，都有独立回退；用户不会因为一个贡献点报错面对整页白屏。",
      ],
    ],
    architecture: {
      title: "平台负责边界，插件负责可见体验。",
      principles: [
        ["运行内核", "发现 manifest、校验贡献点、提供 runtime context、权限桥、存储和错误边界。"],
        [
          "宿主容器",
          "统一承载 Modal、Fullscreen、SettingsHost、Toast 和卡片外壳，插件只请求能力。",
        ],
        ["插件内容区", "官方插件优先使用基础组件和主题 token；第三方插件在约束内表达自己的能力。"],
      ],
      matrix: [
        [
          "layout",
          "区域和入口结构",
          "定义 rail、工具条、搜索区域、网格或流式排列。",
          "必须满足全局可达性和无横向滚动。",
        ],
        [
          "widget",
          "卡片内容与交互",
          "声明支持尺寸、弹窗或全屏视图，独立读写私有数据。",
          "内容不能撑破外壳，不能直接创建全局浮层。",
        ],
        [
          "search",
          "搜索 UI 与 provider",
          "支持默认搜索源、前缀切换、命令建议和本地动作。",
          "外部打开必须经过权限桥，空查询不触发。",
        ],
      ],
    },
    plugins: {
      title: "MVP 用官方插件包证明协议，而不是先做市场。",
      body: "先内置一组可信插件，验证布局切换、多实例、持久化、权限桥和错误隔离。第三方市场、沙箱、审核延后到 V2。",
      rows: [
        [
          "layout",
          "official.layout.workbench-dashboard",
          "左侧轻 rail、顶部命令搜索、四列自适应主网格；移动端折叠为底部工具栏和单列卡片。",
          "默认启用",
        ],
        [
          "layout",
          "official.layout.workbench-focus",
          "无固定 rail，聚焦单一 Hero 卡片与环绕卫星，适合单点深度工作场景。",
          "可切换",
        ],
        [
          "widget",
          "official.widgets.productivity",
          "今日重点、快捷入口、待办、便签、天气等贡献点，每类都可多实例并声明自己的支持尺寸。",
          "多实例",
        ],
        [
          "settings",
          "official.settings.workspace",
          "轻量 settings host 聚合通用、外观、搜索、插件和关于面板；重型权限审计留到后续阶段。",
          "宿主承载",
        ],
      ],
    },
    resources: {
      title: "首页只讲清产品，下载和文档分开承载后续动作。",
      body: "下载页负责平台选择和安装状态；文档页负责快速开始、插件协议、代码示例和基础组件说明。",
      cards: [
        ["下载页", "把浏览器扩展、本地预览和源码入口区分清楚，用户先判断自己该从哪个渠道开始。"],
        ["文档页", "像开源组件库一样组织快速开始、manifest、runtime API、组件用法和可复制代码。"],
        [
          "基础组件规范",
          "官网和文档页复用同一套 Button、Input、Badge、Kbd、Table、Toast 与 Doc* 组合规范。",
        ],
      ],
    },
    cta: {
      title: "先下载体验工作台，再用文档接入插件协议。",
      body: "下一步适合进入真实 MVP 走查：默认工作台、布局切换、添加卡片、命令搜索、设置中心、插件错误回退和基础组件约束。",
      primary: "下载 Tabora",
      secondary: "查看文档",
    },
    footer: ["首页", "下载", "文档", "组件规范"],
    command: {
      query: "@github tabora plugin protocol",
      items: [
        ["↵", "用 GitHub 搜索插件协议", "通过 external-open 权限桥打开外部 URL", "@github"],
        ["⌘L", "切换到 Focus 布局", "保留现有插件实例数据并重渲染布局壳体", "layout"],
        ["⌘,", "打开设置中心", "由宿主 settings host 承载插件贡献面板", "settings"],
      ],
    },
  },
  en: {
    hero: {
      title: "Turn the new tab into a plugin-composed personal workbench.",
      lead: "Tabora does not hardcode search, notes, tasks, or backgrounds into the platform. Layouts, cards, search providers, themes, and settings panels are all contributed through the plugin protocol, so users see a complete workbench while the platform keeps the runtime boundaries.",
      primaryCta: "Download Tabora",
      secondaryCta: "Read docs",
      chips: ["Layouts are plugins", "Local-first MVP", "Docs like a component library"],
    },
    mock: {
      greeting: "Good afternoon",
      date: "Jun 10",
      addCard: "+ Add widget",
      commandPlaceholder: "Search the web, commands, or cards…",
      widgets: {
        focus: {
          title: "Today focus",
          sub: "focus · multi-instance",
          body: "Turn the default new tab into a composable personal work entry.",
        },
        links: {
          title: "Quick links",
          sub: "links · 4 items",
          items: [
            ["PRD", "V2.2"],
            ["GitHub", "repo"],
            ["Linear", "tickets"],
            ["Figma", "tokens"],
          ],
        },
        weather: {
          title: "Weather",
          sub: "weather · Beijing",
          metric: "22°",
          meta: "Sunny · good for work",
        },
        todo: {
          title: "Todo",
          sub: "todo · 3 items",
          items: ["Review widget contract", "Finish provider switcher", "Trim settings backlog"],
        },
        notes: {
          title: "Notes",
          sub: "notes · autosave",
          body: "MVP focus: layouts are plugins too. The platform only provides runtime, permission bridge, persistence, and safe fallbacks.",
        },
        pluginStatus: {
          title: "Plugin status",
          sub: "plugins",
          rows: [
            ["Widgets", "6"],
            ["Layout", "Dashboard"],
            ["Provider", "Google"],
          ],
        },
      },
    },
    stats: [
      ["5+", "official contribution types"],
      ["2", "layout patterns: Dashboard & Focus"],
      ["52+", "base and host components"],
    ],
    featureHead: {
      title: "Not a pile of new-tab features, but a composable workbench protocol.",
      body: "What matters in product review is not more cards, but proving that future capabilities will not push product logic back into the core.",
    },
    features: [
      [
        "Layouts are plugins too",
        "Dashboard and Focus are two official layout patterns. A layout defines regions and entry points without owning widget data or changing widget content.",
      ],
      [
        "Entry points stay reachable",
        "Search, add widget, plugin management, settings, and theme switching must stay reachable through the rail, toolbar, settings center, or command palette.",
      ],
      [
        "Failures stay local",
        "When a widget, settings panel, search plugin, or layout plugin fails, the fallback stays local so users never end up with a full white screen.",
      ],
    ],
    architecture: {
      title: "The platform owns boundaries, plugins own visible experience.",
      principles: [
        [
          "Runtime kernel",
          "Discovers manifests, validates contribution points, and provides runtime context, permission bridge, storage, and error boundaries.",
        ],
        [
          "Host containers",
          "Hosts Modal, Fullscreen, SettingsHost, Toast, and widget shells so plugins only request capabilities.",
        ],
        [
          "Plugin content area",
          "Official plugins prefer base components and theme tokens, while third-party plugins express their own capabilities within constraints.",
        ],
      ],
      matrix: [
        [
          "layout",
          "regions and entry structure",
          "Defines rail, toolbar, search region, grid, or stream arrangement.",
          "Must preserve global reachability and avoid horizontal scrolling.",
        ],
        [
          "widget",
          "card content and interaction",
          "Declares supported sizes, modal or fullscreen views, and reads or writes isolated private data.",
          "Content cannot break the shell and cannot create global overlays directly.",
        ],
        [
          "search",
          "search UI and provider",
          "Supports default provider, prefix switching, command suggestions, and local actions.",
          "External open must go through the permission bridge, and empty queries do not trigger.",
        ],
      ],
    },
    plugins: {
      title: "The MVP proves the protocol with an official plugin pack before any marketplace.",
      body: "Start with a trusted built-in set to validate layout switching, multi-instance support, persistence, permission bridging, and error isolation. Marketplace, sandboxing, and review come later in V2.",
      rows: [
        [
          "layout",
          "official.layout.workbench-dashboard",
          "Left rail, top command search, and a four-column adaptive grid; collapsed into a bottom bar and single-column cards on mobile.",
          "Default on",
        ],
        [
          "layout",
          "official.layout.workbench-focus",
          "No fixed rail, a single hero card with surrounding satellites, suited for deep focus workflows.",
          "Switchable",
        ],
        [
          "widget",
          "official.widgets.productivity",
          "Focus, quick links, todo, notes, and weather contributions; each supports multi-instance and declares its supported sizes.",
          "Multi-instance",
        ],
        [
          "settings",
          "official.settings.workspace",
          "A lightweight settings host that aggregates general, appearance, search, plugins, and about panels; heavy permission auditing stays for later.",
          "Hosted by shell",
        ],
      ],
    },
    resources: {
      title: "The home page explains the product, while download and docs handle next steps.",
      body: "The download page handles platform selection and install status; the docs page handles quick start, plugin protocol, code samples, and base component guidance.",
      cards: [
        [
          "Download page",
          "Separate extension, local preview, and source entry points so users can decide where to start first.",
        ],
        [
          "Docs page",
          "Organize quick start, manifest, runtime API, component usage, and copyable code like an open-source component library.",
        ],
        [
          "Base component spec",
          "The website and docs reuse the same Button, Input, Badge, Kbd, Table, Toast, and Doc* composition rules.",
        ],
      ],
    },
    cta: {
      title: "Try the workbench first, then connect to the plugin protocol through docs.",
      body: "The next useful review pass is the real MVP walkthrough: default workbench, layout switch, adding widgets, command search, settings center, plugin fallbacks, and base component constraints.",
      primary: "Download Tabora",
      secondary: "View docs",
    },
    footer: ["Home", "Download", "Docs", "Component spec"],
    command: {
      query: "@github tabora plugin protocol",
      items: [
        [
          "↵",
          "Search the plugin protocol on GitHub",
          "Open the external URL through the external-open permission bridge",
          "@github",
        ],
        [
          "⌘L",
          "Switch to Focus layout",
          "Keep existing plugin instance data and rerender the layout shell",
          "layout",
        ],
        [
          "⌘,",
          "Open settings center",
          "Hosted by the shell settings host with plugin-contributed panels",
          "settings",
        ],
      ],
    },
  },
}

export type HomePageContent = (typeof homePrototypeContent)["zh-CN"]
