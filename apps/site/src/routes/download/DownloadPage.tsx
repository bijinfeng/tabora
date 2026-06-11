import { A } from "@solidjs/router"
import { createSignal, onCleanup, onMount } from "solid-js"

import { useSiteTheme } from "../../app/AppShell"

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const guessLanguage = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json"
  if (trimmed.includes("<") && trimmed.includes(">")) return "html"
  if (/(^|\n)\s*(pnpm|npm|yarn|bun)\s+/.test(value) || /(^|\n)\s*#/.test(value)) return "bash"
  return "plain"
}

const highlightJson = (value: string) => {
  const escaped = escapeHtml(value)
  const withStrings = escaped.replace(
    /&quot;([^&]|&(?!quot;))*?&quot;/g,
    (match, _content, offset, full) => {
      const after = full.slice(offset + match.length)
      const isKey = /^\s*:/.test(after)
      const cls = isKey ? "tbr-syn-attr" : "tbr-syn-string"
      return `<span class="${cls}">${match}</span>`
    },
  )

  return withStrings
    .replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
      return `<span class="tbr-syn-number">${match}</span>`
    })
    .replace(/\b(true|false|null)\b/g, (match) => {
      return `<span class="tbr-syn-keyword">${match}</span>`
    })
    .replace(/[{}[\],:]/g, (match) => {
      return `<span class="tbr-syn-punct">${match}</span>`
    })
}

const highlightBash = (value: string) => {
  const escaped = escapeHtml(value)
  const withComments = escaped.replace(/(^|\n)\s*#.*$/g, (match) => {
    return `<span class="tbr-syn-comment">${match}</span>`
  })

  const withStrings = withComments.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => {
    return `<span class="tbr-syn-string">${match}</span>`
  })

  return withStrings.replace(/(^|\s)(--?[\w-]+)/g, (match, space, flag) => {
    return `${space}<span class="tbr-syn-keyword">${flag}</span>`
  })
}

const highlightHtmlCode = (value: string) => {
  const escaped = escapeHtml(value)
  const withComments = escaped.replace(/&lt;!--[\s\S]*?--&gt;/g, (match) => {
    return `<span class="tbr-syn-comment">${match}</span>`
  })

  return withComments.replace(/&lt;\/?[\w:-]+[\s\S]*?&gt;/g, (match) => {
    const inner = match.slice(4, -4)
    const isClose = inner.startsWith("/")
    const withoutSlash = isClose ? inner.slice(1) : inner
    const tagName = withoutSlash.match(/^[^\s]+/)?.[0] ?? withoutSlash
    const rest = withoutSlash.slice(tagName.length)
    const tagHead = `${isClose ? "/" : ""}${tagName}`

    const highlightedRest = rest
      .replace(/\s([\w:-]+)(?==)/g, (_m, name: string) => {
        return ` <span class="tbr-syn-attr">${name}</span>`
      })
      .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (valueMatch) => {
        return `<span class="tbr-syn-string">${valueMatch}</span>`
      })

    return `<span class="tbr-syn-punct">&lt;</span><span class="tbr-syn-tag">${tagHead}</span>${highlightedRest}<span class="tbr-syn-punct">&gt;</span>`
  })
}

const highlightCode = (value: string) => {
  const lang = guessLanguage(value)
  if (lang === "json") return highlightJson(value)
  if (lang === "html") return highlightHtmlCode(value)
  if (lang === "bash") return highlightBash(value)
  const escaped = escapeHtml(value)
  return escaped
    .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => {
      return `<span class="tbr-syn-string">${match}</span>`
    })
    .replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
      return `<span class="tbr-syn-number">${match}</span>`
    })
}

export function DownloadPage() {
  const theme = useSiteTheme()
  const [toastMessage, setToastMessage] = createSignal("")
  const [toastVisible, setToastVisible] = createSignal(false)
  let toastTimer = 0
  const [openFaq, setOpenFaq] = createSignal<ReadonlySet<number>>(new Set())

  const showToast = (message: string) => {
    window.clearTimeout(toastTimer)
    setToastMessage(message)
    setToastVisible(true)
    toastTimer = window.setTimeout(() => setToastVisible(false), 2600)
  }

  const toggleFaq = (index: number) => {
    setOpenFaq((value) => {
      const next = new Set(value)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  onMount(() => {
    const timer = window.setTimeout(() => {
      document.querySelectorAll("pre > code").forEach((element) => {
        if (!(element instanceof HTMLElement)) return
        if (element.dataset.syntax === "true") return
        element.dataset.syntax = "true"
        element.innerHTML = highlightCode(element.textContent ?? "")
      })
    }, 0)

    onCleanup(() => window.clearTimeout(timer))
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
            <A href="/">首页</A>
            <A href="/#product">产品</A>
            <A class="active" href="/download">
              下载
            </A>
            <A href="/docs">文档</A>
            <A href="/#plugins">官方插件</A>
          </nav>
          <div class="site-nav-actions">
            <A class="btn btn-secondary" href="/docs#quickstart">
              安装文档
            </A>
            <a class="btn btn-secondary" href="#platforms">
              选择平台
            </a>
            <button
              class="btn btn-icon"
              type="button"
              data-dark-toggle
              aria-label="切换深色模式"
              onClick={() => {
                theme.toggleDark()
                showToast(theme.dark() ? "已切换为暗色主题。" : "已切换为明亮主题。")
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
        <section
          class="site-section site-page-hero"
          data-od-id="download-hero"
          data-component="SiteHero SiteDownloadPanel"
        >
          <div class="site-container site-page-grid">
            <div class="site-page-copy">
              <p class="site-eyebrow">DOWNLOAD TABORA</p>
              <h1>把新标签页换成一个安静的插件工作台。</h1>
              <p class="site-lead">
                Tabora
                优先作为浏览器扩展使用。下载页把稳定入口、预览入口和源码入口拆开，用户可以先安装默认工作台，再逐步接入卡片、搜索源和主题。
              </p>
              <div class="site-cta-row">
                <a class="btn btn-primary" href="#platforms">
                  选择平台
                </a>
                <A class="btn btn-secondary" href="/docs#quickstart">
                  查看快速开始
                </A>
              </div>
            </div>

            <aside class="download-panel" aria-label="发布通道">
              <div class="download-panel-head">
                <span>release channel</span>
                <span>tabora.newtab</span>
              </div>
              <div class="download-panel-body">
                <div class="download-row">
                  <div>
                    <h3>浏览器扩展</h3>
                    <p>推荐入口。安装后打开新标签页即可进入默认工作台。</p>
                  </div>
                  <span class="badge">Recommended</span>
                </div>
                <div class="download-row">
                  <div>
                    <h3>本地预览包</h3>
                    <p>适合产品评审和早期体验，先验证 Dashboard / Stream 布局。</p>
                  </div>
                  <span class="badge">Preview</span>
                </div>
                <div class="download-row">
                  <div>
                    <h3>源码构建</h3>
                    <p>适合开发者查看插件协议、基础组件和 runtime context。</p>
                  </div>
                  <span class="badge">Open</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          class="site-section"
          id="platforms"
          data-od-id="platforms"
          data-component="SiteDownloadCard"
        >
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">PLATFORMS</p>
                <h2>先选入口，再进入工作台。</h2>
              </div>
              <p>下载卡片只说明真实可用路径和状态，不用虚假的版本号或商店评分填充页面。</p>
            </div>

            <div class="site-stat-strip" aria-label="平台信息" style="margin-bottom: 32px">
              <div class="site-stat">
                <strong>Chrome</strong>
                <span>主力入口，商店发布中</span>
              </div>
              <div class="site-stat">
                <strong>本地构建</strong>
                <span>开发者预览，源码公开</span>
              </div>
              <div class="site-stat">
                <strong>Edge / Firefox</strong>
                <span>路线图中，节奏待定</span>
              </div>
            </div>

            <div class="download-grid">
              <article class="download-card featured">
                <span class="download-mark">CR</span>
                <h3>Chrome / Chromium 扩展</h3>
                <p>
                  主入口。安装后 Tabora 接管新标签页，默认包含今日重点、快捷入口、便签、待办和搜索。
                </p>
                <div class="download-actions">
                  <span class="badge">商店发布中</span>
                  <span class="badge">推荐</span>
                </div>
              </article>
              <article class="download-card">
                <span class="download-mark">ED</span>
                <h3>Microsoft Edge 扩展</h3>
                <p>
                  Edge 用户使用同一套工作台、插件协议和基础组件约束，扩展发布节奏与 Chrome
                  保持一致。
                </p>
                <div class="download-actions">
                  <span class="badge">即将开放</span>
                  <span class="badge">浏览器</span>
                </div>
              </article>
              <article class="download-card">
                <span class="download-mark">SRC</span>
                <h3>源码和本地构建</h3>
                <p>
                  适合想先走查协议边界的开发者：manifest、contributions、runtime API
                  和组件库文档都在文档页。
                </p>
                <div class="download-actions">
                  <A class="btn btn-secondary" href="/docs#quickstart">
                    构建说明
                  </A>
                  <span class="badge">Developer</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="install" data-component="SiteInstallSteps">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">INSTALL</p>
                <h2>三步进入默认工作台。</h2>
              </div>
              <p>安装流程强调用户能马上看到什么，避免让下载页变成完整技术文档。</p>
            </div>

            <div class="install-grid">
              <article class="install-card">
                <span class="meta">01</span>
                <h3>安装扩展</h3>
                <p>选择浏览器入口，允许 Tabora 作为新标签页运行。</p>
              </article>
              <article class="install-card">
                <span class="meta">02</span>
                <h3>打开新标签页</h3>
                <p>默认工作台会加载 Dashboard 布局和官方生产力插件包。</p>
              </article>
              <article class="install-card">
                <span class="meta">03</span>
                <h3>整理第一屏</h3>
                <p>添加快捷入口、搜索源和卡片实例；布局切换不会丢失实例数据。</p>
              </article>
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="developer-install" data-component="DocsCodeBlock">
          <div class="site-container site-split">
            <div class="site-principles">
              <p class="site-eyebrow">DEVELOPER PREVIEW</p>
              <h2>开发者可以先用本地构建验证协议。</h2>
              <div class="site-principle">
                <strong>不跳过组件约束</strong>
                <span>
                  官方插件内容区优先使用基础组件，不直接创建宿主级 modal、toast 或 settings 容器。
                </span>
              </div>
              <div class="site-principle">
                <strong>先验证贡献点</strong>
                <span>从 manifest、widget、settings panel 和 search provider 四类贡献点开始。</span>
              </div>
            </div>

            <div class="docs-code">
              <div class="code-head">
                <span>local preview</span>
                <button
                  class="copy-btn"
                  type="button"
                  data-copy-target="#download-install-code"
                  onClick={async () => {
                    const code = document
                      .querySelector<HTMLElement>("#download-install-code")
                      ?.textContent?.trim()
                    if (!code) return
                    try {
                      await navigator.clipboard?.writeText(code)
                      showToast("代码已复制。")
                    } catch {
                      showToast("复制失败，请手动选择代码。")
                    }
                  }}
                >
                  复制
                </button>
              </div>
              <div class="code-window">
                <pre>
                  <code id="download-install-code">{`pnpm install
pnpm dev

# 打开浏览器扩展开发者模式
# 加载 dist/extension 作为未打包扩展
# 新建标签页后进入 Tabora 工作台`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="support" data-component="SiteSupportTable">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">SUPPORT</p>
                <h2>支持范围写清楚，避免用户误判。</h2>
              </div>
              <p>下载页只给用户决策需要的信息；协议、API 和组件细节进入文档页。</p>
            </div>

            <div class="support-table" aria-label="平台支持范围">
              <div class="support-row">
                <strong>Chrome / Chromium</strong>
                <span>推荐使用方式，支持新标签页扩展体验。</span>
                <span class="badge">Ready</span>
              </div>
              <div class="support-row">
                <strong>Microsoft Edge</strong>
                <span>同样的扩展能力和工作台体验，发布节奏随后同步。</span>
                <span class="badge">Preview</span>
              </div>
              <div class="support-row">
                <strong>Firefox</strong>
                <span>规划中。需要补充新标签页权限和扩展打包差异。</span>
                <span class="badge">Planned</span>
              </div>
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="faq" data-component="SiteFAQ">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">FAQ</p>
                <h2>常见问题。</h2>
              </div>
              <p>安装前最常被问到的几个问题，给出直接答案。</p>
            </div>

            <div class="faq-list" aria-label="常见问题">
              <div class="faq-item" classList={{ open: openFaq().has(0) }} data-faq-item>
                <button
                  class="faq-trigger"
                  type="button"
                  data-faq-trigger
                  aria-expanded={openFaq().has(0)}
                  onClick={() => toggleFaq(0)}
                >
                  Tabora 会访问我的浏览记录吗？
                  <span class="faq-icon" aria-hidden="true">
                    +
                  </span>
                </button>
                <div class="faq-body" data-faq-body hidden={!openFaq().has(0)}>
                  <p>
                    不会。Tabora 只使用新标签页权限，使用 localStorage
                    本地存储插件数据，不读取浏览历史、书签或账号信息。搜索源切换使用 external-open
                    权限桥，外部请求显式经过权限确认。
                  </p>
                </div>
              </div>
              <div class="faq-item" classList={{ open: openFaq().has(1) }} data-faq-item>
                <button
                  class="faq-trigger"
                  type="button"
                  data-faq-trigger
                  aria-expanded={openFaq().has(1)}
                  onClick={() => toggleFaq(1)}
                >
                  安装后我的默认搜索引擎会改变吗？
                  <span class="faq-icon" aria-hidden="true">
                    +
                  </span>
                </button>
                <div class="faq-body" data-faq-body hidden={!openFaq().has(1)}>
                  <p>
                    不会。Tabora
                    只接管新标签页，不修改搜索引擎、主页或其他浏览器设置。命令搜索是工作台内的快捷入口，不影响浏览器的地址栏搜索行为。
                  </p>
                </div>
              </div>
              <div class="faq-item" classList={{ open: openFaq().has(2) }} data-faq-item>
                <button
                  class="faq-trigger"
                  type="button"
                  data-faq-trigger
                  aria-expanded={openFaq().has(2)}
                  onClick={() => toggleFaq(2)}
                >
                  如果某个插件崩溃，整个工作台会白屏吗？
                  <span class="faq-icon" aria-hidden="true">
                    +
                  </span>
                </button>
                <div class="faq-body" data-faq-body hidden={!openFaq().has(2)}>
                  <p>
                    不会。每个
                    widget、搜索插件、布局插件和设置面板都有独立错误边界。贡献点失败只影响该实例，宿主容器和其他插件保持正常运行。错误信息只在该实例位置显示，不会扩散。
                  </p>
                </div>
              </div>
              <div class="faq-item" classList={{ open: openFaq().has(3) }} data-faq-item>
                <button
                  class="faq-trigger"
                  type="button"
                  data-faq-trigger
                  aria-expanded={openFaq().has(3)}
                  onClick={() => toggleFaq(3)}
                >
                  我可以写自己的插件吗？
                  <span class="faq-icon" aria-hidden="true">
                    +
                  </span>
                </button>
                <div class="faq-body" data-faq-body hidden={!openFaq().has(3)}>
                  <p>
                    可以。Tabora 的插件协议是公开的：创建 <code>tabora.plugin.json</code>{" "}
                    声明贡献点，用 TSX 实现 widget 或 settings panel 组件，通过 runtime context
                    请求存储和宿主能力。详细说明在文档页的快速开始和 manifest 章节。
                  </p>
                </div>
              </div>
              <div class="faq-item" classList={{ open: openFaq().has(4) }} data-faq-item>
                <button
                  class="faq-trigger"
                  type="button"
                  data-faq-trigger
                  aria-expanded={openFaq().has(4)}
                  onClick={() => toggleFaq(4)}
                >
                  目前是否有 Firefox 版本？
                  <span class="faq-icon" aria-hidden="true">
                    +
                  </span>
                </button>
                <div class="faq-body" data-faq-body hidden={!openFaq().has(4)}>
                  <p>
                    暂时没有。MVP 阶段优先 Chrome/Chromium，Edge 和 Firefox 在路线图中。Firefox
                    的新标签页扩展权限和打包方式与 Chrome 有差异，会在验证完 MVP 协议后单独处理。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="site-section site-cta" data-od-id="download-cta" data-component="SiteCTA">
          <div class="site-container site-cta-panel">
            <p class="site-eyebrow">NEXT STEP</p>
            <h2>下载后从文档页接入第一个插件。</h2>
            <p class="site-lead" style="margin-inline: auto">
              文档页包含快速开始、manifest 示例、runtime API、基础组件说明和组件库式示例。
            </p>
            <div class="site-cta-row" style="justify-content: center">
              <A class="btn btn-primary" href="/docs">
                阅读文档
              </A>
              <A class="btn btn-secondary" href="/">
                返回首页
              </A>
            </div>
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
