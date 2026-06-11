import type { SiteLocale } from "../app/AppShell"

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

export const downloadPrototypeContent: Record<SiteLocale, any> = {
  "zh-CN": {
    hero: {
      title: "把新标签页换成一个安静的插件工作台。",
      lead: "Tabora 优先作为浏览器扩展使用。下载页把稳定入口、预览入口和源码入口拆开，用户可以先安装默认工作台，再逐步接入卡片、搜索源和主题。",
      primary: "选择平台",
      secondary: "查看快速开始",
    },
    panel: {
      rows: [
        ["浏览器扩展", "推荐入口。安装后打开新标签页即可进入默认工作台。", "Recommended"],
        ["本地预览包", "适合产品评审和早期体验，先验证 Dashboard / Stream 布局。", "Preview"],
        ["源码构建", "适合开发者查看插件协议、基础组件和 runtime context。", "Open"],
      ],
    },
    platforms: {
      title: "先选入口，再进入工作台。",
      body: "下载卡片只说明真实可用路径和状态，不用虚假的版本号或商店评分填充页面。",
      stats: [
        ["Chrome", "主力入口，商店发布中"],
        ["本地构建", "开发者预览，源码公开"],
        ["Edge / Firefox", "路线图中，节奏待定"],
      ],
      cards: [
        [
          "CR",
          "Chrome / Chromium 扩展",
          "主入口。安装后 Tabora 接管新标签页，默认包含今日重点、快捷入口、便签、待办和搜索。",
          ["商店发布中", "推荐"],
        ],
        [
          "ED",
          "Microsoft Edge 扩展",
          "Edge 用户使用同一套工作台、插件协议和基础组件约束，扩展发布节奏与 Chrome 保持一致。",
          ["即将开放", "浏览器"],
        ],
        [
          "SRC",
          "源码和本地构建",
          "适合想先走查协议边界的开发者：manifest、contributions、runtime API 和组件库文档都在文档页。",
          ["构建说明", "Developer"],
        ],
      ],
    },
    install: {
      title: "三步进入默认工作台。",
      body: "安装流程强调用户能马上看到什么，避免让下载页变成完整技术文档。",
      steps: [
        ["01", "安装扩展", "选择浏览器入口，允许 Tabora 作为新标签页运行。"],
        ["02", "打开新标签页", "默认工作台会加载 Dashboard 布局和官方生产力插件包。"],
        ["03", "整理第一屏", "添加快捷入口、搜索源和卡片实例；布局切换不会丢失实例数据。"],
      ],
    },
    dev: {
      title: "开发者可以先用本地构建验证协议。",
      principles: [
        [
          "不跳过组件约束",
          "官方插件内容区优先使用基础组件，不直接创建宿主级 modal、toast 或 settings 容器。",
        ],
        ["先验证贡献点", "从 manifest、widget、settings panel 和 search provider 四类贡献点开始。"],
      ],
      copyLabel: "复制",
      copied: "代码已复制。",
      copyFailed: "复制失败，请手动选择代码。",
    },
    support: {
      title: "支持范围写清楚，避免用户误判。",
      body: "下载页只给用户决策需要的信息；协议、API 和组件细节进入文档页。",
      rows: [
        ["Chrome / Chromium", "推荐使用方式，支持新标签页扩展体验。", "Ready"],
        ["Microsoft Edge", "同样的扩展能力和工作台体验，发布节奏随后同步。", "Preview"],
        ["Firefox", "规划中。需要补充新标签页权限和扩展打包差异。", "Planned"],
      ],
    },
    faq: {
      title: "常见问题。",
      body: "安装前最常被问到的几个问题，给出直接答案。",
      items: [
        [
          "Tabora 会访问我的浏览记录吗？",
          "不会。Tabora 只使用新标签页权限，使用 localStorage 本地存储插件数据，不读取浏览历史、书签或账号信息。搜索源切换使用 external-open 权限桥，外部请求显式经过权限确认。",
        ],
        [
          "安装后我的默认搜索引擎会改变吗？",
          "不会。Tabora 只接管新标签页，不修改搜索引擎、主页或其他浏览器设置。命令搜索是工作台内的快捷入口，不影响浏览器的地址栏搜索行为。",
        ],
        [
          "如果某个插件崩溃，整个工作台会白屏吗？",
          "不会。每个 widget、搜索插件、布局插件和设置面板都有独立错误边界。贡献点失败只影响该实例，宿主容器和其他插件保持正常运行。错误信息只在该实例位置显示，不会扩散。",
        ],
        [
          "我可以写自己的插件吗？",
          "可以。Tabora 的插件协议是公开的：创建 tabora.plugin.json 声明贡献点，用 TSX 实现 widget 或 settings panel 组件，通过 runtime context 请求存储和宿主能力。详细说明在文档页的快速开始和 manifest 章节。",
        ],
        [
          "目前是否有 Firefox 版本？",
          "暂时没有。MVP 阶段优先 Chrome/Chromium，Edge 和 Firefox 在路线图中。Firefox 的新标签页扩展权限和打包方式与 Chrome 有差异，会在验证完 MVP 协议后单独处理。",
        ],
      ],
    },
    cta: {
      title: "下载后从文档页接入第一个插件。",
      body: "文档页包含快速开始、manifest 示例、runtime API、基础组件说明和组件库式示例。",
      primary: "阅读文档",
      secondary: "返回首页",
    },
  },
  en: {
    hero: {
      title: "Replace the new tab with a calm plugin workbench.",
      lead: "Tabora is designed to be used first as a browser extension. The download page separates the stable entry, preview entry, and source entry so users can install the default workbench first and then add cards, providers, and themes step by step.",
      primary: "Choose platform",
      secondary: "View quick start",
    },
    panel: {
      rows: [
        [
          "Browser extension",
          "Recommended entry. Open a new tab after install to enter the default workbench.",
          "Recommended",
        ],
        [
          "Local preview build",
          "Best for product review and early evaluation; validate Dashboard / Stream layouts first.",
          "Preview",
        ],
        [
          "Source build",
          "Best for developers who want to inspect the plugin protocol, base components, and runtime context.",
          "Open",
        ],
      ],
    },
    platforms: {
      title: "Choose an entry point first, then enter the workbench.",
      body: "The download cards only explain real paths and statuses. No fake version numbers or store ratings are used as filler.",
      stats: [
        ["Chrome", "primary entry, store release in progress"],
        ["Local build", "developer preview, source available"],
        ["Edge / Firefox", "on the roadmap, timing TBD"],
      ],
      cards: [
        [
          "CR",
          "Chrome / Chromium extension",
          "Primary entry. After install, Tabora takes over the new tab and ships with focus, quick links, notes, todo, and search by default.",
          ["Store release", "Recommended"],
        ],
        [
          "ED",
          "Microsoft Edge extension",
          "Edge users get the same workbench, protocol, and component constraints, with release timing aligned to Chrome.",
          ["Coming soon", "Browser"],
        ],
        [
          "SRC",
          "Source and local build",
          "For developers who want to review protocol boundaries first: manifest, contributions, runtime API, and the component docs all live in the docs page.",
          ["Build guide", "Developer"],
        ],
      ],
    },
    install: {
      title: "Get into the default workbench in three steps.",
      body: "The installation flow focuses on what users will see immediately, instead of turning the download page into full technical documentation.",
      steps: [
        [
          "01",
          "Install the extension",
          "Choose a browser entry and allow Tabora to run as the new tab page.",
        ],
        [
          "02",
          "Open a new tab",
          "The default workbench loads the Dashboard layout and the official productivity plugin pack.",
        ],
        [
          "03",
          "Shape the first screen",
          "Add quick links, providers, and widget instances; switching layouts keeps instance data intact.",
        ],
      ],
    },
    dev: {
      title: "Developers can validate the protocol through a local build first.",
      principles: [
        [
          "Do not skip component constraints",
          "Official plugin content prefers base components and does not directly create host-level modal, toast, or settings containers.",
        ],
        [
          "Validate contribution points first",
          "Start with manifest, widget, settings panel, and search provider contribution types.",
        ],
      ],
      copyLabel: "Copy",
      copied: "Code copied.",
      copyFailed: "Copy failed. Please select the code manually.",
    },
    support: {
      title: "Keep the support matrix explicit so users do not guess wrong.",
      body: "The download page only gives the information users need to decide; protocol, API, and component details stay in docs.",
      rows: [
        [
          "Chrome / Chromium",
          "Recommended entry with the full new-tab extension experience.",
          "Ready",
        ],
        [
          "Microsoft Edge",
          "Same extension capability and workbench experience, released after Chrome.",
          "Preview",
        ],
        [
          "Firefox",
          "Planned. Needs extra work for new-tab permissions and packaging differences.",
          "Planned",
        ],
      ],
    },
    faq: {
      title: "FAQ.",
      body: "Direct answers to the most common questions before installation.",
      items: [
        [
          "Does Tabora access my browsing history?",
          "No. Tabora only uses the new-tab permission and stores plugin data locally. It does not read browsing history, bookmarks, or account data. Provider switching uses the external-open permission bridge so external requests remain explicit.",
        ],
        [
          "Will installation change my default search engine?",
          "No. Tabora only takes over the new tab page and does not modify the search engine, homepage, or other browser settings. Command search is a workbench shortcut and does not affect address bar search.",
        ],
        [
          "If a plugin crashes, will the whole workbench white-screen?",
          "No. Every widget, search plugin, layout plugin, and settings panel has its own error boundary. A failed contribution only affects that instance while the host shell and other plugins continue to work.",
        ],
        [
          "Can I write my own plugin?",
          "Yes. Tabora's plugin protocol is public: create tabora.plugin.json to declare contributions, implement a widget or settings panel in TSX, and request storage or host abilities through runtime context. Full details live in docs.",
        ],
        [
          "Is there a Firefox version yet?",
          "Not yet. MVP focuses on Chrome/Chromium first, with Edge and Firefox on the roadmap. Firefox has different new-tab permissions and packaging requirements, so it will be handled after the MVP protocol is validated.",
        ],
      ],
    },
    cta: {
      title: "Install first, then connect your first plugin through docs.",
      body: "The docs page includes quick start, manifest examples, runtime API, base component references, and component-library style examples.",
      primary: "Read docs",
      secondary: "Back to home",
    },
  },
}
