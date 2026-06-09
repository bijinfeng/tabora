import { TaboraMark } from "@tabora/brand"
import { Button } from "@tabora/ui"
import { applyThemeTokens } from "@tabora/theme"
import { A, useLocation, useNavigate } from "@solidjs/router"
import { createEffect, createMemo, createSignal, For, type JSX, Show } from "solid-js"

import { ComponentDocsPage, DocsHomePage } from "./ComponentDocsPage"
import workbenchScreenshot from "../../playground/src/__screenshots__/workbenchDashboard.e2e.test.tsx/workbench-dashboard-layout-renders-the-plugin-provided-dashboard-shell-and-supports-core-widget-interactions-1.png"

type LayoutMode = "dashboard" | "stream"

const lightTokens = {
  "tbr-color-page": "246 247 244",
  "tbr-color-surface": "255 255 255",
  "tbr-color-surface-soft": "250 250 248",
  "tbr-color-surface-hover": "242 244 240",
  "tbr-color-text": "28 30 28",
  "tbr-color-text-muted": "107 110 106",
  "tbr-color-text-subtle": "148 151 146",
  "tbr-color-line": "230 232 227",
  "tbr-color-line-strong": "209 212 206",
  "tbr-color-inverse": "255 255 255",
  "tbr-color-shadow": "0 0 0",
  "tbr-color-shadow-strong": "15 23 18",
  "tbr-color-scrim": "8 10 8",
  "tbr-color-accent": "26 144 112",
  "tbr-color-accent-hover": "21 120 92",
  "tbr-color-accent-soft": "234 245 240",
  "tbr-color-danger": "201 69 69",
  "tbr-color-danger-soft": "254 240 240",
  "tbr-color-success": "45 138 94",
  "tbr-color-warning": "166 106 18",
  "tbr-color-info": "61 123 168",
  "tbr-color-focus": "26 144 112",
}

const darkTokens = {
  "tbr-color-page": "25 28 26",
  "tbr-color-surface": "37 41 39",
  "tbr-color-surface-soft": "42 46 44",
  "tbr-color-surface-hover": "50 55 52",
  "tbr-color-text": "237 240 237",
  "tbr-color-text-muted": "182 186 182",
  "tbr-color-text-subtle": "134 139 134",
  "tbr-color-line": "59 64 60",
  "tbr-color-line-strong": "83 89 84",
  "tbr-color-inverse": "25 28 26",
  "tbr-color-shadow": "0 0 0",
  "tbr-color-shadow-strong": "15 23 18",
  "tbr-color-scrim": "8 10 8",
  "tbr-color-accent": "52 209 158",
  "tbr-color-accent-hover": "92 224 182",
  "tbr-color-accent-soft": "26 46 38",
  "tbr-color-danger": "239 139 139",
  "tbr-color-danger-soft": "42 30 30",
  "tbr-color-success": "79 196 154",
  "tbr-color-warning": "213 161 74",
  "tbr-color-info": "127 183 223",
  "tbr-color-focus": "52 209 158",
}

const signals = [
  ["Focus", "打开浏览器后，第一眼看到今天要推进的事项。"],
  ["Search", "命令、网页和搜索源集中在一个入口。"],
  ["Cards", "便签、待办、链接和信息块可以按工作流扩展。"],
  ["Local", "布局、顺序和插件数据优先保存在本地。"],
]

const problems = [
  ["01", "今天先做什么", "少数优先事项应该固定在第一屏，而不是被浏览记录、消息和内容流盖住。"],
  ["02", "常用入口在哪里", "项目文档、工具和链接应该围绕当前工作组织，不必每次重新查找。"],
  ["03", "临时想法放哪", "便签和待办承接短想法、会议前准备和临时任务，不需要打开完整应用。"],
]

const plugins = [
  ["官方生产力卡片", "今日重点、快捷入口、便签、待办构成默认首屏。", "Built-in", ""],
  ["搜索源", "不同搜索服务可以挂到同一个命令入口。", "Search", "blue"],
  ["主题和背景", "视觉通过 token 应用，保持一致、克制和可读。", "Theme", "amber"],
]

const installSteps = [
  ["01", "安装浏览器扩展", "把 Tabora 设置为新标签页，每次打开浏览器都回到工作台。"],
  ["02", "选择布局", "从 Dashboard 开始，也可以切换到更适合专注工作的 Stream。"],
  ["03", "添加卡片", "按项目和任务继续添加便签、待办、入口和未来插件。"],
]

const platformCards = [
  [
    "CR",
    "Chrome 扩展",
    "适合大多数用户。安装后打开新标签页，就能进入 Tabora 工作台。",
    "商店发布中",
    "推荐",
  ],
  [
    "ED",
    "Edge 扩展",
    "适合使用 Microsoft Edge 的用户，保持同样的新标签页体验。",
    "即将开放",
    "浏览器",
  ],
  ["GH", "源码版本", "适合希望查看项目、参与构建或自行打包扩展的用户。", "源码入口", "Open"],
]

const supportRows = [
  ["Chrome / Chromium", "推荐使用方式，支持新标签页扩展体验。", "Ready"],
  ["Microsoft Edge", "适合 Edge 用户，保持同样的工作台能力。", "Ready"],
  ["Firefox", "浏览器扩展入口规划中，后续补充适配。", "Planned"],
]

export function App(props: { children?: JSX.Element }) {
  const [dark, setDark] = createSignal(false)
  const location = useLocation()

  createEffect(() => {
    applyThemeTokens(document.documentElement, dark() ? darkTokens : lightTokens)
    document.documentElement.classList.toggle("site-dark", dark())
  })

  createEffect(() => {
    const hash = location.hash
    if (hash) queueMicrotask(() => document.querySelector(hash)?.scrollIntoView())
    else queueMicrotask(() => window.scrollTo({ top: 0 }))
  })

  return (
    <div class="site" id="top">
      <Topbar onToggleTheme={() => setDark((v) => !v)} />
      {props.children}
    </div>
  )
}

export function HomeRoute() {
  return <HomePage />
}

export function DownloadRoute() {
  return <DownloadPage />
}

export function DocsHomeRoute() {
  return <DocsHomePage />
}

export function ComponentDocsRoute() {
  return <ComponentDocsPage />
}

function scrollToHash(hash: string) {
  queueMicrotask(() => document.querySelector(hash)?.scrollIntoView())
}

function Topbar(props: { onToggleTheme: () => void }) {
  const location = useLocation()
  const isDocs = () => location.pathname.startsWith("/docs")
  return (
    <header class="topbar">
      <A class="brand" aria-label="Tabora 首页" href="/">
        <TaboraMark class="brand-mark" />
        <span>Tabora</span>
      </A>
      <nav class="nav" aria-label="主导航">
        <A href="/#workbench" onClick={() => scrollToHash("#workbench")}>
          工作台
        </A>
        <A href="/#anatomy" onClick={() => scrollToHash("#anatomy")}>
          界面
        </A>
        <A href="/#layouts" onClick={() => scrollToHash("#layouts")}>
          布局
        </A>
        <A href="/#plugins" onClick={() => scrollToHash("#plugins")}>
          插件
        </A>
        <A href="/download">下载</A>
        <A href="/docs" classList={{ active: isDocs() }}>
          文档
        </A>
      </nav>
      <button
        class="theme-toggle"
        type="button"
        aria-label="切换主题"
        onClick={props.onToggleTheme}
      >
        <span class="theme-dot" aria-hidden="true" />
      </button>
    </header>
  )
}

function HomePage() {
  const navigate = useNavigate()
  return (
    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <div class="label">PERSONAL BROWSER WORKBENCH</div>
          <h1 id="hero-title">Tabora</h1>
          <p>
            一个插件优先的个人工作台新标签页。把今日重点、快捷入口、便签、待办和命令搜索放进同一个极简界面。
          </p>
          <div class="hero-actions">
            <Button variant="primary" onClick={() => navigate("/download")}>
              下载 Tabora
            </Button>
            <Button variant="secondary" onClick={() => scrollToHash("#anatomy")}>
              查看界面
            </Button>
          </div>
        </div>

        <ProductStage />
      </section>

      <section class="signal-strip" aria-label="Tabora 核心能力">
        <For each={signals}>
          {(item) => (
            <div class="signal">
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </div>
          )}
        </For>
      </section>

      <section class="section" id="workbench">
        <SectionHead
          label="WHY TABORA"
          title="新标签页不应该只是搜索框和背景图"
          description="Tabora 面向每天反复打开浏览器的人。它把工作启动时最常见的三个问题，放到一个稳定、可整理的界面里。"
        />
        <div class="problem-row">
          <For each={problems}>
            {(item, index) => (
              <article class="problem">
                <span class="problem-index">{item[0]}</span>
                <h3>{item[1]}</h3>
                <p class="muted">{item[2]}</p>
                <UiFragment variant={index()} />
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="section" id="anatomy">
        <SectionHead
          label="INTERFACE"
          title="一个工作台，而不是一组松散的小组件"
          description="搜索、卡片、主题和设置在同一个界面里各司其职。默认视图保持安静，卡片变多时仍然按工作流组织。"
        />
        <div class="anatomy">
          <img src={workbenchScreenshot} alt="Tabora 工作台区域说明" />
          <span class="pin search">Command Search</span>
          <span class="pin focus">Today Focus</span>
          <span class="pin links">Quick Links</span>
          <span class="pin notes">Notes</span>
          <span class="pin theme">Theme</span>
        </div>
      </section>

      <LayoutsSection />
      <PluginsSection />
      <StartSection />
      <Cta />
      <Footer />
    </main>
  )
}

function DownloadPage() {
  const navigate = useNavigate()
  return (
    <main>
      <section class="download-hero" id="download" aria-labelledby="download-title">
        <div class="hero-copy">
          <div class="label">DOWNLOAD TABORA</div>
          <h1 id="download-title">下载 Tabora</h1>
          <p>
            把浏览器新标签页换成一个极简个人工作台。先安装扩展，打开新标签页，再按自己的节奏添加卡片和搜索源。
          </p>
          <div class="hero-actions">
            <Button
              variant="primary"
              onClick={() => document.querySelector("#platforms")?.scrollIntoView()}
            >
              选择平台
            </Button>
            <Button variant="secondary" onClick={() => navigate("/#anatomy")}>
              查看界面
            </Button>
          </div>
        </div>
        <DownloadConsole />
      </section>

      <section class="section" id="platforms">
        <SectionHead
          label="PLATFORMS"
          title="选择你的使用方式"
          description="Tabora 优先作为浏览器新标签页使用。下载页先给用户明确入口，同时保留本地体验和源码入口。"
        />
        <div class="download-grid">
          <For each={platformCards}>
            {(item, index) => (
              <article class="card" classList={{ "card-featured": index() === 0 }}>
                <span class="platform-mark">{item[0]}</span>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
                <div class="card-actions">
                  <span class="button-static">{item[3]}</span>
                  <span class="tag">{item[4]}</span>
                </div>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="section">
        <SectionHead
          label="INSTALL"
          title="三步进入工作台"
          description="安装后不需要复杂配置。先使用默认首屏，再根据工作方式继续整理。"
        />
        <div class="start-grid">
          <For each={installSteps}>
            {(item) => (
              <article class="start-card">
                <span class="problem-index">{item[0]}</span>
                <h3>{item[1]}</h3>
                <p class="muted">{item[2]}</p>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="section">
        <SectionHead
          label="SUPPORT"
          title="支持范围"
          description="下载页面需要让用户快速判断是否适合自己，而不是阅读完整技术文档。"
        />
        <div class="table" aria-label="支持范围">
          <For each={supportRows}>
            {(row, index) => (
              <div class="table-row">
                <strong>{row[0]}</strong>
                <span>{row[1]}</span>
                <span class="tag" classList={{ blue: index() === 1 }}>
                  {row[2]}
                </span>
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="cta" aria-label="下载 Tabora">
        <div class="copy">
          <h2>把新标签页变成真正的工作起点</h2>
          <p>从默认工作台开始，再按自己的节奏添加卡片、搜索源和主题。</p>
        </div>
        <div class="footer-actions">
          <Button
            variant="primary"
            onClick={() => document.querySelector("#platforms")?.scrollIntoView()}
          >
            选择平台
          </Button>
          <Button variant="secondary" onClick={() => navigate("/")}>
            返回首页
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  )
}

function ProductStage() {
  return (
    <div class="product-stage" aria-label="Tabora 产品界面">
      <div class="stage-top">
        <div class="stage-dots" aria-hidden="true">
          <span class="stage-dot" />
          <span class="stage-dot" />
          <span class="stage-dot" />
        </div>
        <span>tabora://workbench</span>
      </div>
      <img src={workbenchScreenshot} alt="Tabora 工作台界面截图" />
    </div>
  )
}

function DownloadConsole() {
  return (
    <aside class="download-console" aria-label="下载状态">
      <div class="console-top">
        <span>release channel</span>
        <span>tabora.newtab</span>
      </div>
      <div class="console-body">
        <For
          each={[
            ["浏览器扩展", "推荐入口。安装后即可把 Tabora 设置为新标签页。", "Recommended", ""],
            ["本地工作台", "适合想先体验布局、主题和卡片系统的用户。", "Preview", "blue"],
            ["插件扩展", "从默认工作台开始，后续接入更多卡片和搜索源。", "Plugin-first", ""],
          ]}
        >
          {(item) => (
            <div class="console-row">
              <div>
                <h3>{item[0]}</h3>
                <p class="muted">{item[1]}</p>
              </div>
              <span class="tag" classList={{ blue: item[3] === "blue" }}>
                {item[2]}
              </span>
            </div>
          )}
        </For>
      </div>
    </aside>
  )
}

function SectionHead(props: { label: string; title: string; description: string }) {
  return (
    <div class="section-head">
      <div class="label">{props.label}</div>
      <h2>{props.title}</h2>
      <p>{props.description}</p>
    </div>
  )
}

function UiFragment(props: { variant: number }) {
  return (
    <div class="ui-fragment" aria-hidden="true">
      <Show when={props.variant === 0}>
        <div class="ui-line" />
        <div class="ui-pill" />
      </Show>
      <Show when={props.variant === 1}>
        <div class="ui-pill" />
        <div class="ui-pill" />
        <div class="ui-pill" />
      </Show>
      <Show when={props.variant === 2}>
        <div class="ui-block" />
      </Show>
    </div>
  )
}

function LayoutsSection() {
  const [mode, setMode] = createSignal<LayoutMode>("dashboard")
  const isDashboard = createMemo(() => mode() === "dashboard")

  return (
    <section class="section" id="layouts">
      <SectionHead
        label="LAYOUTS"
        title="同一套内容，两种工作节奏"
        description="仪表盘适合并行扫视，流式布局适合连续推进。切换布局不改变卡片语义，只改变你面对信息的方式。"
      />
      <div class="layout-panel">
        <div class="layout-toolbar" aria-label="布局切换">
          <button
            class="layout-tab"
            type="button"
            data-active={isDashboard()}
            onClick={() => setMode("dashboard")}
          >
            Dashboard
          </button>
          <button
            class="layout-tab"
            type="button"
            data-active={!isDashboard()}
            onClick={() => setMode("stream")}
          >
            Stream
          </button>
        </div>
        <div class="layout-stage">
          <Show when={isDashboard()} fallback={<StreamShot />}>
            <DashboardShot />
          </Show>
        </div>
      </div>
    </section>
  )
}

function DashboardShot() {
  return (
    <div class="layout-shot dashboard-shot" aria-label="Dashboard 布局示意">
      <div class="v-rail" />
      <div class="v-main">
        <div class="v-bar" />
        <div class="v-grid">
          <div class="v-card" />
          <div class="v-card" />
          <div class="v-card" />
          <div class="v-card" />
        </div>
      </div>
    </div>
  )
}

function StreamShot() {
  return (
    <div class="layout-shot stream-shot" aria-label="Stream 布局示意">
      <div class="v-bar" />
      <div class="v-columns">
        <div class="v-column" />
        <div class="v-column" />
      </div>
    </div>
  )
}

function PluginsSection() {
  const navigate = useNavigate()
  return (
    <section class="section" id="plugins">
      <div class="plugin-grid">
        <div class="copy">
          <div class="label">PLUGIN-FIRST</div>
          <h2>默认好用，也能继续扩展</h2>
          <p>
            用户先获得稳定的默认工作台。搜索源、卡片、背景、主题和设置面板可以继续由插件贡献，让新标签页不会被固定模板锁死。
          </p>
          <div class="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/download")}>
              下载 Tabora
            </Button>
            <Button variant="secondary" onClick={() => navigate("/#anatomy")}>
              查看界面
            </Button>
          </div>
        </div>

        <div class="plugin-list">
          <For each={plugins}>
            {(item) => (
              <article class="plugin-row">
                <div>
                  <h3>{item[0]}</h3>
                  <p class="muted">{item[1]}</p>
                </div>
                <span
                  class="tag"
                  classList={{ blue: item[3] === "blue", amber: item[3] === "amber" }}
                >
                  {item[2]}
                </span>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}

function StartSection() {
  return (
    <section class="section" id="start">
      <SectionHead
        label="START"
        title="从一个极简的新标签页开始"
        description="先使用默认工作台，再根据自己的工作方式增加卡片、搜索源和主题。"
      />
      <div class="start-grid">
        <For each={installSteps}>
          {(item) => (
            <article class="start-card">
              <span class="problem-index">{item[0]}</span>
              <h3>{item[1]}</h3>
              <p class="muted">{item[2]}</p>
            </article>
          )}
        </For>
      </div>
    </section>
  )
}

function Cta() {
  const navigate = useNavigate()
  return (
    <section class="cta" aria-label="开始使用 Tabora">
      <div class="copy">
        <h2>把浏览器打开后的第一屏，留给真正要做的事</h2>
        <p>Tabora 让新标签页成为一个可扩展、可持续整理的个人工作台。</p>
      </div>
      <div class="footer-actions">
        <Button variant="primary" onClick={() => navigate("/download")}>
          下载 Tabora
        </Button>
        <Button variant="secondary" onClick={() => navigate("/#anatomy")}>
          查看界面
        </Button>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer class="footer">
      <span>Tabora</span>
      <div class="footer-links">
        <A href="/#workbench">工作台</A>
        <A href="/#anatomy">界面</A>
        <A href="/#plugins">插件</A>
        <A href="/download">下载</A>
        <A href="/docs">文档</A>
      </div>
    </footer>
  )
}
