import type { SiteLocale } from "../../app/AppShell"

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

export type DownloadPageContent = (typeof downloadPrototypeContent)["zh-CN"]
