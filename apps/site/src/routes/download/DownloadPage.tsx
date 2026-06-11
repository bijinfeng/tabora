import { A } from "@solidjs/router"
import { createMemo, createSignal, onCleanup, onMount } from "solid-js"

import { useSiteI18n } from "../../app/AppShell"
import { PrototypeTopnav } from "../../shared/PrototypeTopnav"
import { downloadPrototypeContent } from "../../shared/prototypeContent"

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
  const i18n = useSiteI18n()
  const content = createMemo(() => downloadPrototypeContent[i18n.locale()])
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
      <PrototypeTopnav
        active="download"
        actions={[
          { href: "/docs#quickstart", label: i18n.t("action.installDocs"), variant: "secondary" },
          { href: "#platforms", label: i18n.t("action.choosePlatform"), variant: "secondary" },
        ]}
        onThemeToggled={showToast}
      />

      <main>
        <section
          class="site-section site-page-hero"
          data-od-id="download-hero"
          data-component="SiteHero SiteDownloadPanel"
        >
          <div class="site-container site-page-grid">
            <div class="site-page-copy">
              <p class="site-eyebrow">DOWNLOAD TABORA</p>
              <h1>{content().hero.title}</h1>
              <p class="site-lead">{content().hero.lead}</p>
              <div class="site-cta-row">
                <a class="btn btn-primary" href="#platforms">
                  {content().hero.primary}
                </a>
                <A class="btn btn-secondary" href="/docs#quickstart">
                  {content().hero.secondary}
                </A>
              </div>
            </div>

            <aside class="download-panel" aria-label="发布通道">
              <div class="download-panel-head">
                <span>release channel</span>
                <span>tabora.newtab</span>
              </div>
              <div class="download-panel-body">
                {content().panel.rows.map((row: [string, string, string]) => (
                  <div class="download-row">
                    <div>
                      <h3>{row[0]}</h3>
                      <p>{row[1]}</p>
                    </div>
                    <span class="badge">{row[2]}</span>
                  </div>
                ))}
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
                <h2>{content().platforms.title}</h2>
              </div>
              <p>{content().platforms.body}</p>
            </div>

            <div class="site-stat-strip" aria-label="平台信息" style="margin-bottom: 32px">
              {content().platforms.stats.map((item: [string, string]) => (
                <div class="site-stat">
                  <strong>{item[0]}</strong>
                  <span>{item[1]}</span>
                </div>
              ))}
            </div>

            <div class="download-grid">
              {content().platforms.cards.map(
                (card: [string, string, string, [string, string]], index: number) => (
                  <article class="download-card" classList={{ featured: index === 0 }}>
                    <span class="download-mark">{card[0]}</span>
                    <h3>{card[1]}</h3>
                    <p>{card[2]}</p>
                    <div class="download-actions">
                      {index === 2 ? (
                        <>
                          <A class="btn btn-secondary" href="/docs#quickstart">
                            {card[3][0]}
                          </A>
                          <span class="badge">{card[3][1]}</span>
                        </>
                      ) : (
                        <>
                          <span class="badge">{card[3][0]}</span>
                          <span class="badge">{card[3][1]}</span>
                        </>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="install" data-component="SiteInstallSteps">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">INSTALL</p>
                <h2>{content().install.title}</h2>
              </div>
              <p>{content().install.body}</p>
            </div>

            <div class="install-grid">
              {content().install.steps.map((step: [string, string, string]) => (
                <article class="install-card">
                  <span class="meta">{step[0]}</span>
                  <h3>{step[1]}</h3>
                  <p>{step[2]}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="developer-install" data-component="DocsCodeBlock">
          <div class="site-container site-split">
            <div class="site-principles">
              <p class="site-eyebrow">DEVELOPER PREVIEW</p>
              <h2>{content().dev.title}</h2>
              {content().dev.principles.map((item: [string, string]) => (
                <div class="site-principle">
                  <strong>{item[0]}</strong>
                  <span>{item[1]}</span>
                </div>
              ))}
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
                      showToast(content().dev.copied)
                    } catch {
                      showToast(content().dev.copyFailed)
                    }
                  }}
                >
                  {content().dev.copyLabel}
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
                <h2>{content().support.title}</h2>
              </div>
              <p>{content().support.body}</p>
            </div>

            <div class="support-table" aria-label="平台支持范围">
              {content().support.rows.map((row: [string, string, string]) => (
                <div class="support-row">
                  <strong>{row[0]}</strong>
                  <span>{row[1]}</span>
                  <span class="badge">{row[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="faq" data-component="SiteFAQ">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">FAQ</p>
                <h2>{content().faq.title}</h2>
              </div>
              <p>{content().faq.body}</p>
            </div>

            <div class="faq-list" aria-label="常见问题">
              {content().faq.items.map((item: [string, string], index: number) => (
                <div class="faq-item" classList={{ open: openFaq().has(index) }} data-faq-item>
                  <button
                    class="faq-trigger"
                    type="button"
                    data-faq-trigger
                    aria-expanded={openFaq().has(index)}
                    onClick={() => toggleFaq(index)}
                  >
                    {item[0]}
                    <span class="faq-icon" aria-hidden="true">
                      +
                    </span>
                  </button>
                  <div class="faq-body" data-faq-body hidden={!openFaq().has(index)}>
                    <p>{item[1]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section class="site-section site-cta" data-od-id="download-cta" data-component="SiteCTA">
          <div class="site-container site-cta-panel">
            <p class="site-eyebrow">NEXT STEP</p>
            <h2>{content().cta.title}</h2>
            <p class="site-lead" style="margin-inline: auto">
              {content().cta.body}
            </p>
            <div class="site-cta-row" style="justify-content: center">
              <A class="btn btn-primary" href="/docs">
                {content().cta.primary}
              </A>
              <A class="btn btn-secondary" href="/">
                {content().cta.secondary}
              </A>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer" data-od-id="footer" data-component="SiteFooter">
        <div class="site-container site-footer-inner">
          <span>© 2026 Tabora</span>
          <span class="meta">
            <A href="/">{i18n.t("nav.home")}</A> · <A href="/download">{i18n.t("nav.download")}</A>{" "}
            · <A href="/docs">{i18n.t("nav.docs")}</A> ·{" "}
            <A href="/docs/components">{i18n.t("footer.componentSpec")}</A>
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
