import { A } from "@solidjs/router"
import { createEffect, createSignal, onCleanup, onMount } from "solid-js"

import { useSiteI18n, useSiteTheme } from "../../app/AppShell"
import { LocaleToggleButton } from "../../shared/LocaleToggleButton"

export function HomePage() {
  return <SiteLandingHome />
}

function SiteLandingHome() {
  const theme = useSiteTheme()
  const i18n = useSiteI18n()
  const [commandOpen, setCommandOpen] = createSignal(false)
  const [toastMessage, setToastMessage] = createSignal("")
  const [toastVisible, setToastVisible] = createSignal(false)
  let toastTimer = 0
  let commandTrigger: HTMLElement | null = null
  let commandInputRef: HTMLInputElement | null = null

  const showToast = (message: string) => {
    window.clearTimeout(toastTimer)
    setToastMessage(message)
    setToastVisible(true)
    toastTimer = window.setTimeout(() => setToastVisible(false), 2600)
  }

  const openCommand = (trigger?: HTMLElement) => {
    commandTrigger = trigger ?? (document.activeElement as HTMLElement | null) ?? null
    setCommandOpen(true)
  }

  const closeCommand = () => {
    if (!commandOpen()) return
    setCommandOpen(false)
    commandTrigger?.focus?.()
  }

  createEffect(() => {
    if (!commandOpen()) return
    queueMicrotask(() => commandInputRef?.focus())
  })

  onMount(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        openCommand()
        return
      }

      if (event.key === "Escape") {
        closeCommand()
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
        event.preventDefault()
        theme.toggleDark()
        showToast(theme.dark() ? i18n.t("toast.theme.dark") : i18n.t("toast.theme.light"))
      }
    }

    window.addEventListener("keydown", onKeydown)

    onCleanup(() => {
      window.removeEventListener("keydown", onKeydown)
      window.clearTimeout(toastTimer)
    })
  })

  return (
    <>
      <header class="site-topnav" data-od-id="topnav" data-component="SiteTopnav">
        <div class="site-container site-topnav-inner">
          <A class="site-logo" href="/" aria-label="Tabora 首页">
            <span class="site-logo-mark" aria-hidden="true">
              T
            </span>
            <span>Tabora</span>
          </A>
          <nav class="site-navlinks" aria-label="主导航">
            <A class="active" href="/">
              {i18n.t("nav.home")}
            </A>
            <a href="#product">{i18n.t("nav.product")}</a>
            <A href="/download">{i18n.t("nav.download")}</A>
            <A href="/docs">{i18n.t("nav.docs")}</A>
            <a href="#plugins">{i18n.t("nav.officialPlugins")}</a>
          </nav>
          <div class="site-nav-actions">
            <A class="btn btn-secondary" href="/docs">
              {i18n.t("action.devDocs")}
            </A>
            <A class="btn btn-primary" href="/download">
              {i18n.t("nav.download")}
            </A>
            <LocaleToggleButton class="btn btn-secondary btn-sm" />
            <button
              class="btn btn-icon"
              type="button"
              data-dark-toggle
              aria-label={i18n.t("a11y.toggleTheme")}
              onClick={() => {
                theme.toggleDark()
                showToast(theme.dark() ? i18n.t("toast.theme.dark") : i18n.t("toast.theme.light"))
              }}
            >
              <svg
                class="icon-moon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <svg
                class="icon-sun"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section class="site-section site-hero" data-od-id="hero" data-component="SiteHero">
          <div class="site-container site-hero-grid">
            <div class="site-hero-copy">
              <p class="site-eyebrow">PLUGIN-FIRST NEW TAB</p>
              <h1>把新标签页变成插件装配的个人工作台。</h1>
              <p class="site-lead">
                Tabora
                不把搜索、便签、待办和背景写死在平台里。布局、卡片、搜索源、主题和设置面板都通过插件协议贡献，用户看到的是完整工作台，平台保留的是运行边界。
              </p>
              <div class="site-cta-row">
                <A class="btn btn-primary" href="/download">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                  下载 Tabora
                </A>
                <A class="btn btn-secondary" href="/docs">
                  阅读文档
                </A>
              </div>
              <div class="site-chip-row" aria-label="产品边界">
                <span class="chip site-chip">布局也是插件</span>
                <span class="chip site-chip">本地优先 MVP</span>
                <span class="chip site-chip">组件库式文档</span>
              </div>
            </div>

            <div class="site-product-shell" id="product" data-component="SiteProductPreview">
              <div class="site-browser-bar">
                <div class="site-traffic" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div class="site-address">new-tab://tabora/workbench</div>
                <span class="kbd kbd-inline">⌘K</span>
              </div>
              <div class="site-workbench" data-mock-root>
                <aside class="site-rail" aria-label="工作台导航">
                  <span class="site-rail-brand" aria-hidden="true">
                    T
                  </span>
                  <div class="site-rail-groups" role="tablist" aria-label="分组">
                    <button
                      class="site-rail-btn site-rail-group active"
                      type="button"
                      aria-label="默认分组"
                      aria-current="true"
                    >
                      <span>T</span>
                    </button>
                    <button class="site-rail-btn site-rail-group" type="button" aria-label="设计稿">
                      <span>◐</span>
                    </button>
                    <button class="site-rail-btn site-rail-group" type="button" aria-label="阅读">
                      <span>★</span>
                    </button>
                  </div>
                  <div class="site-rail-divider" aria-hidden="true" />
                  <button class="site-rail-btn site-rail-add" type="button" aria-label="新建分组">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      aria-hidden="true"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <div class="site-rail-spacer" />
                  <button class="site-rail-btn" type="button" aria-label="切换布局">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </button>
                  <button class="site-rail-btn" type="button" aria-label="主题">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                    </svg>
                  </button>
                  <button class="site-rail-btn" type="button" aria-label="设置">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                </aside>

                <div class="site-workspace">
                  <div class="site-greeting">
                    <span class="site-greeting-text">
                      下午好<span class="site-greeting-muted"> · 6 月 10 日</span>
                    </span>
                    <button class="site-greeting-add" type="button">
                      + 添加卡片
                    </button>
                  </div>

                  <label class="site-command">
                    <span class="site-provider-badge">
                      <span class="site-provider-dot" aria-hidden="true" />
                      Google
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        aria-hidden="true"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                    <span class="site-command-sep" aria-hidden="true" />
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                    <input value="搜索网页、命令或卡片…" aria-label="命令搜索" />
                    <span class="kbd kbd-inline">⌘K</span>
                  </label>

                  <div class="site-widget-grid">
                    <article class="site-widget large">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">今日重点</span>
                          <span class="site-widget-sub">focus · 多实例</span>
                        </div>
                        <span class="status-dot" aria-label="已同步" />
                      </div>
                      <div class="focus-line">把默认新标签页做成可组合的个人工作入口</div>
                    </article>
                    <article class="site-widget">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">快捷入口</span>
                          <span class="site-widget-sub">links · 4 项</span>
                        </div>
                        <span class="chip site-chip">links</span>
                      </div>
                      <div class="quick-links">
                        <button class="quick-link" type="button">
                          <strong>PRD</strong>
                          <span>V2.2</span>
                        </button>
                        <button class="quick-link" type="button">
                          <strong>GitHub</strong>
                          <span>repo</span>
                        </button>
                        <button class="quick-link" type="button">
                          <strong>Linear</strong>
                          <span>tickets</span>
                        </button>
                        <button class="quick-link" type="button">
                          <strong>Figma</strong>
                          <span>tokens</span>
                        </button>
                      </div>
                    </article>
                    <article class="site-widget">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">天气</span>
                          <span class="site-widget-sub">weather · 北京</span>
                        </div>
                        <span class="chip site-chip site-chip-ok">live</span>
                      </div>
                      <div class="weather">
                        <div class="weather-mark">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2" />
                          </svg>
                        </div>
                        <div>
                          <div class="metric">22°</div>
                          <span class="meta">晴 · 适合工作</span>
                        </div>
                      </div>
                    </article>
                    <article class="site-widget">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">待办</span>
                          <span class="site-widget-sub">todo · 3 项</span>
                        </div>
                        <span class="chip site-chip">tasks</span>
                      </div>
                      <div class="task-list">
                        <div class="task">
                          <span class="check done" />
                          <span>复核 widget 协议</span>
                        </div>
                        <div class="task">
                          <span class="check" />
                          <span>补齐搜索源切换</span>
                        </div>
                        <div class="task">
                          <span class="check" />
                          <span>清理设置后置项</span>
                        </div>
                      </div>
                    </article>
                    <article class="site-widget large">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">便签</span>
                          <span class="site-widget-sub">notes · autosave</span>
                        </div>
                        <span class="chip site-chip">draft</span>
                      </div>
                      <p class="notes-body">
                        MVP 重点：布局本身也是插件。平台只提供运行时、权限桥、持久化与安全回退。
                      </p>
                    </article>
                    <article class="site-widget">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">插件状态</span>
                          <span class="site-widget-sub">plugins</span>
                        </div>
                        <span class="chip site-chip site-chip-ok">healthy</span>
                      </div>
                      <div class="plugin-stats">
                        <div class="plugin-stat">
                          <span>Widget</span>
                          <strong>6</strong>
                        </div>
                        <div class="plugin-stat">
                          <span>布局</span>
                          <strong>Dashboard</strong>
                        </div>
                        <div class="plugin-stat">
                          <span>搜索源</span>
                          <strong>Google</strong>
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="stats" data-component="SiteStatStrip">
          <div class="site-container">
            <div class="site-stat-strip" aria-label="产品数据">
              <div class="site-stat">
                <strong>5+</strong>
                <span>官方插件贡献点</span>
              </div>
              <div class="site-stat">
                <strong>2</strong>
                <span>布局范式 Dashboard & Focus</span>
              </div>
              <div class="site-stat">
                <strong>52+</strong>
                <span>基础组件和宿主组件</span>
              </div>
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="features" data-component="SiteFeatureGrid">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">WHAT CHANGES</p>
                <h2>不是新标签页功能堆叠，而是可装配的工作台协议。</h2>
              </div>
              <p>
                产品评审最需要看到的不是更多卡片，而是：未来增加能力时，平台不会重新把业务逻辑写回核心。
              </p>
            </div>
            <div class="site-feature-grid">
              <article class="site-feature">
                <div class="site-feature-mark">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M4 5h16v5H4zM4 14h7v5H4zM15 14h5v5h-5z" />
                  </svg>
                </div>
                <h3>布局本身也是插件</h3>
                <p>
                  Dashboard 和 Focus 是两种官方布局范式。布局决定区域和入口，不接管 widget
                  数据，也不改变卡片内容。
                </p>
              </article>
              <article class="site-feature">
                <div class="site-feature-mark">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </div>
                <h3>入口在任何布局下可达</h3>
                <p>
                  搜索、添加卡片、插件管理、设置和主题切换必须通过
                  rail、工具条、设置中心或命令面板保持可达。
                </p>
              </article>
              <article class="site-feature">
                <div class="site-feature-mark">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M12 3 4 7v6c0 4 3.2 6.5 8 8 4.8-1.5 8-4 8-8V7z" />
                    <path d="m9 12 2 2 4-5" />
                  </svg>
                </div>
                <h3>失败被限制在局部</h3>
                <p>
                  Widget、设置面板、搜索插件或布局插件失败时，都有独立回退；用户不会因为一个贡献点报错面对整页白屏。
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          class="site-section"
          id="architecture"
          data-od-id="architecture"
          data-component="SiteProof"
        >
          <div class="site-container site-split">
            <div class="site-principles">
              <p class="site-eyebrow">ARCHITECTURE POSTURE</p>
              <h2>平台负责边界，插件负责可见体验。</h2>
              <div class="site-principle">
                <strong>运行内核</strong>
                <span>
                  发现 manifest、校验贡献点、提供 runtime context、权限桥、存储和错误边界。
                </span>
              </div>
              <div class="site-principle">
                <strong>宿主容器</strong>
                <span>
                  统一承载 Modal、Fullscreen、SettingsHost、Toast 和卡片外壳，插件只请求能力。
                </span>
              </div>
              <div class="site-principle">
                <strong>插件内容区</strong>
                <span>
                  官方插件优先使用基础组件和主题 token；第三方插件在约束内表达自己的能力。
                </span>
              </div>
            </div>

            <div class="site-matrix" role="table" aria-label="插件类型自由度与约束">
              <div class="site-matrix-row site-matrix-head" role="row">
                <div class="site-matrix-cell" role="columnheader">
                  类型
                </div>
                <div class="site-matrix-cell" role="columnheader">
                  自由度
                </div>
                <div class="site-matrix-cell" role="columnheader">
                  硬约束
                </div>
              </div>
              <div class="site-matrix-row" role="row">
                <div class="site-matrix-cell" role="cell">
                  <strong>layout</strong>
                  <span>区域和入口结构</span>
                </div>
                <div class="site-matrix-cell" role="cell">
                  <span>定义 rail、工具条、搜索区域、网格或流式排列。</span>
                </div>
                <div class="site-matrix-cell" role="cell">
                  <span>必须满足全局可达性和无横向滚动。</span>
                </div>
              </div>
              <div class="site-matrix-row" role="row">
                <div class="site-matrix-cell" role="cell">
                  <strong>widget</strong>
                  <span>卡片内容与交互</span>
                </div>
                <div class="site-matrix-cell" role="cell">
                  <span>声明支持尺寸、弹窗或全屏视图，独立读写私有数据。</span>
                </div>
                <div class="site-matrix-cell" role="cell">
                  <span>内容不能撑破外壳，不能直接创建全局浮层。</span>
                </div>
              </div>
              <div class="site-matrix-row" role="row">
                <div class="site-matrix-cell" role="cell">
                  <strong>search</strong>
                  <span>搜索 UI 与 provider</span>
                </div>
                <div class="site-matrix-cell" role="cell">
                  <span>支持默认搜索源、前缀切换、命令建议和本地动作。</span>
                </div>
                <div class="site-matrix-cell" role="cell">
                  <span>外部打开必须经过权限桥，空查询不触发。</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="site-section" id="plugins" data-od-id="plugins" data-component="SiteProof">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">OFFICIAL PLUGINS</p>
                <h2>MVP 用官方插件包证明协议，而不是先做市场。</h2>
              </div>
              <p>
                先内置一组可信插件，验证布局切换、多实例、持久化、权限桥和错误隔离。第三方市场、沙箱、审核延后到
                V2。
              </p>
            </div>
            <div class="site-log-list">
              <article class="site-log-row">
                <span class="meta">layout</span>
                <div>
                  <h3>official.layout.workbench-dashboard</h3>
                  <p>
                    左侧轻 rail、顶部命令搜索、四列自适应主网格；移动端折叠为底部工具栏和单列卡片。
                  </p>
                </div>
                <span class="meta">默认启用</span>
              </article>
              <article class="site-log-row">
                <span class="meta">layout</span>
                <div>
                  <h3>official.layout.workbench-focus</h3>
                  <p>无固定 rail，聚焦单一 Hero 卡片与环绕卫星，适合单点深度工作场景。</p>
                </div>
                <span class="meta">可切换</span>
              </article>
              <article class="site-log-row">
                <span class="meta">widget</span>
                <div>
                  <h3>official.widgets.productivity</h3>
                  <p>
                    今日重点、快捷入口、待办、便签、天气等贡献点，每类都可多实例并声明自己的支持尺寸。
                  </p>
                </div>
                <span class="meta">多实例</span>
              </article>
              <article class="site-log-row">
                <span class="meta">settings</span>
                <div>
                  <h3>official.settings.workspace</h3>
                  <p>
                    轻量 settings host
                    聚合通用、外观、搜索、插件和关于面板；重型权限审计留到后续阶段。
                  </p>
                </div>
                <span class="meta">宿主承载</span>
              </article>
            </div>
          </div>
        </section>

        <section
          class="site-section"
          id="resources"
          data-od-id="resources"
          data-component="SiteFeatureGrid"
        >
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">GET STARTED</p>
                <h2>首页只讲清产品，下载和文档分开承载后续动作。</h2>
              </div>
              <p>
                下载页负责平台选择和安装状态；文档页负责快速开始、插件协议、代码示例和基础组件说明。
              </p>
            </div>
            <div class="site-feature-grid">
              <A class="site-feature" href="/download">
                <div class="site-feature-mark" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                </div>
                <h3>下载页</h3>
                <p>把浏览器扩展、本地预览和源码入口区分清楚，用户先判断自己该从哪个渠道开始。</p>
              </A>
              <A class="site-feature" href="/docs">
                <div class="site-feature-mark" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M4 5h16v14H4z" />
                    <path d="M8 9h8M8 13h5" />
                  </svg>
                </div>
                <h3>文档页</h3>
                <p>像开源组件库一样组织快速开始、manifest、runtime API、组件用法和可复制代码。</p>
              </A>
              <A class="site-feature" href="/docs/components">
                <div class="site-feature-mark" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M4 7h16M4 12h10M4 17h16" />
                  </svg>
                </div>
                <h3>基础组件规范</h3>
                <p>
                  官网和文档页复用同一套 Button、Input、Badge、Kbd、Table、Toast 与 Doc* 组合规范。
                </p>
              </A>
            </div>
          </div>
        </section>

        <section
          class="site-section site-cta"
          id="waitlist"
          data-od-id="cta-strip"
          data-component="SiteCTA SiteWaitlist"
        >
          <div class="site-container site-cta-panel">
            <p class="site-eyebrow">NEXT REVIEW</p>
            <h2>先下载体验工作台，再用文档接入插件协议。</h2>
            <p class="site-lead" style="margin-inline: auto">
              下一步适合进入真实 MVP
              走查：默认工作台、布局切换、添加卡片、命令搜索、设置中心、插件错误回退和基础组件约束。
            </p>
            <div class="site-cta-row" style="justify-content: center">
              <A class="btn btn-primary" href="/download">
                下载 Tabora
              </A>
              <A class="btn btn-secondary" href="/docs">
                查看文档
              </A>
            </div>
            <form
              class="site-waitlist"
              data-waitlist
              onSubmit={(event) => {
                event.preventDefault()
                const form = event.currentTarget
                const emailValue = new FormData(form).get("email")
                const email = typeof emailValue === "string" ? emailValue : ""
                if (!email.includes("@")) {
                  showToast("请输入有效邮箱。")
                  return
                }
                form.reset()
                showToast("已记录评审请求，下一步会进入 MVP 走查。")
              }}
            >
              <input
                class="inp"
                type="email"
                name="email"
                placeholder="name@example.com"
                aria-label="邮箱"
                required
              />
              <button class="btn btn-secondary" type="submit">
                请求产品评审
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer class="site-footer" data-od-id="footer" data-component="SiteFooter">
        <div class="site-container site-footer-inner">
          <span>© 2026 Tabora</span>
          <span class="meta">
            <A href="/">首页</A> · <A href="/download">下载</A> · <A href="/docs">文档</A> ·{" "}
            <A href="/docs/components">组件规范</A>
          </span>
        </div>
      </footer>

      <div
        class="command-dialog"
        classList={{ visible: commandOpen() }}
        data-command-dialog
        data-component="SiteCommandDialog"
        aria-hidden={!commandOpen()}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeCommand()
        }}
      >
        <div class="palette" role="dialog" aria-modal="true" aria-label="命令面板">
          <div class="palette-head">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={(element) => (commandInputRef = element)}
              value="@github tabora plugin protocol"
              aria-label="命令搜索示例"
            />
            <span class="kbd kbd-inline">Esc</span>
          </div>
          <div class="palette-list">
            <div class="palette-item active">
              <span class="kbd kbd-inline">↵</span>
              <div>
                <strong>用 GitHub 搜索插件协议</strong>
                <br />
                <span>通过 external-open 权限桥打开外部 URL</span>
              </div>
              <span class="meta">@github</span>
            </div>
            <div class="palette-item">
              <span class="kbd kbd-inline">⌘L</span>
              <div>
                <strong>切换到 Focus 布局</strong>
                <br />
                <span>保留现有插件实例数据并重渲染布局壳体</span>
              </div>
              <span class="meta">layout</span>
            </div>
            <div class="palette-item">
              <span class="kbd kbd-inline">⌘,</span>
              <div>
                <strong>打开设置中心</strong>
                <br />
                <span>由宿主 settings host 承载插件贡献面板</span>
              </div>
              <span class="meta">settings</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="toast"
        classList={{ visible: toastVisible() }}
        role="status"
        aria-live="polite"
        data-toast
        data-component="SiteToast"
      >
        {toastMessage()}
      </div>
    </>
  )
}
