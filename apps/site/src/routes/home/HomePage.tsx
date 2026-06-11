import { A } from "@solidjs/router"
import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js"

import { useSiteI18n, useSiteTheme } from "../../app/AppShell"
import { PrototypeTopnav } from "../../shared/PrototypeTopnav"
import { homePrototypeContent } from "../../shared/prototypeContent"

export function HomePage() {
  return <SiteLandingHome />
}

function SiteLandingHome() {
  const theme = useSiteTheme()
  const i18n = useSiteI18n()
  const content = createMemo(() => homePrototypeContent[i18n.locale()])
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
      <PrototypeTopnav
        active="home"
        actions={[
          { href: "/docs", label: i18n.t("action.devDocs"), variant: "secondary" },
          { href: "/download", label: i18n.t("nav.download"), variant: "primary" },
        ]}
        onThemeToggled={showToast}
      />

      <main>
        <section class="site-section site-hero" data-od-id="hero" data-component="SiteHero">
          <div class="site-container site-hero-grid">
            <div class="site-hero-copy">
              <p class="site-eyebrow">PLUGIN-FIRST NEW TAB</p>
              <h1>{content().hero.title}</h1>
              <p class="site-lead">{content().hero.lead}</p>
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
                  {content().hero.primaryCta}
                </A>
                <A class="btn btn-secondary" href="/docs">
                  {content().hero.secondaryCta}
                </A>
              </div>
              <div class="site-chip-row" aria-label="产品边界">
                {content().hero.chips.map((chip: string) => (
                  <span class="chip site-chip">{chip}</span>
                ))}
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
                      {content().mock.greeting}
                      <span class="site-greeting-muted"> · {content().mock.date}</span>
                    </span>
                    <button class="site-greeting-add" type="button">
                      {content().mock.addCard}
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
                    <input value={content().mock.commandPlaceholder} aria-label="命令搜索" />
                    <span class="kbd kbd-inline">⌘K</span>
                  </label>

                  <div class="site-widget-grid">
                    <article class="site-widget large">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">
                            {content().mock.widgets.focus.title}
                          </span>
                          <span class="site-widget-sub">{content().mock.widgets.focus.sub}</span>
                        </div>
                        <span class="status-dot" aria-label="已同步" />
                      </div>
                      <div class="focus-line">{content().mock.widgets.focus.body}</div>
                    </article>
                    <article class="site-widget">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">
                            {content().mock.widgets.links.title}
                          </span>
                          <span class="site-widget-sub">{content().mock.widgets.links.sub}</span>
                        </div>
                        <span class="chip site-chip">links</span>
                      </div>
                      <div class="quick-links">
                        {content().mock.widgets.links.items.map((item: [string, string]) => (
                          <button class="quick-link" type="button">
                            <strong>{item[0]}</strong>
                            <span>{item[1]}</span>
                          </button>
                        ))}
                      </div>
                    </article>
                    <article class="site-widget">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">
                            {content().mock.widgets.weather.title}
                          </span>
                          <span class="site-widget-sub">{content().mock.widgets.weather.sub}</span>
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
                          <div class="metric">{content().mock.widgets.weather.metric}</div>
                          <span class="meta">{content().mock.widgets.weather.meta}</span>
                        </div>
                      </div>
                    </article>
                    <article class="site-widget">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">{content().mock.widgets.todo.title}</span>
                          <span class="site-widget-sub">{content().mock.widgets.todo.sub}</span>
                        </div>
                        <span class="chip site-chip">tasks</span>
                      </div>
                      <div class="task-list">
                        <div class="task">
                          <span class="check done" />
                          <span>{content().mock.widgets.todo.items[0]}</span>
                        </div>
                        <div class="task">
                          <span class="check" />
                          <span>{content().mock.widgets.todo.items[1]}</span>
                        </div>
                        <div class="task">
                          <span class="check" />
                          <span>{content().mock.widgets.todo.items[2]}</span>
                        </div>
                      </div>
                    </article>
                    <article class="site-widget large">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">
                            {content().mock.widgets.notes.title}
                          </span>
                          <span class="site-widget-sub">{content().mock.widgets.notes.sub}</span>
                        </div>
                        <span class="chip site-chip">draft</span>
                      </div>
                      <p class="notes-body">{content().mock.widgets.notes.body}</p>
                    </article>
                    <article class="site-widget">
                      <div class="site-widget-head">
                        <div class="site-widget-title-block">
                          <span class="site-widget-title">
                            {content().mock.widgets.pluginStatus.title}
                          </span>
                          <span class="site-widget-sub">
                            {content().mock.widgets.pluginStatus.sub}
                          </span>
                        </div>
                        <span class="chip site-chip site-chip-ok">healthy</span>
                      </div>
                      <div class="plugin-stats">
                        {content().mock.widgets.pluginStatus.rows.map((row: [string, string]) => (
                          <div class="plugin-stat">
                            <span>{row[0]}</span>
                            <strong>{row[1]}</strong>
                          </div>
                        ))}
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
              {content().stats.map((item: [string, string]) => (
                <div class="site-stat">
                  <strong>{item[0]}</strong>
                  <span>{item[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section class="site-section" data-od-id="features" data-component="SiteFeatureGrid">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">WHAT CHANGES</p>
                <h2>{content().featureHead.title}</h2>
              </div>
              <p>{content().featureHead.body}</p>
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
                <h3>{content().features[0][0]}</h3>
                <p>{content().features[0][1]}</p>
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
                <h3>{content().features[1][0]}</h3>
                <p>{content().features[1][1]}</p>
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
                <h3>{content().features[2][0]}</h3>
                <p>{content().features[2][1]}</p>
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
              <h2>{content().architecture.title}</h2>
              {content().architecture.principles.map((item: [string, string]) => (
                <div class="site-principle">
                  <strong>{item[0]}</strong>
                  <span>{item[1]}</span>
                </div>
              ))}
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
              {content().architecture.matrix.map((row: [string, string, string, string]) => (
                <div class="site-matrix-row" role="row">
                  <div class="site-matrix-cell" role="cell">
                    <strong>{row[0]}</strong>
                    <span>{row[1]}</span>
                  </div>
                  <div class="site-matrix-cell" role="cell">
                    <span>{row[2]}</span>
                  </div>
                  <div class="site-matrix-cell" role="cell">
                    <span>{row[3]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section class="site-section" id="plugins" data-od-id="plugins" data-component="SiteProof">
          <div class="site-container">
            <div class="site-section-head">
              <div>
                <p class="site-eyebrow">OFFICIAL PLUGINS</p>
                <h2>{content().plugins.title}</h2>
              </div>
              <p>{content().plugins.body}</p>
            </div>
            <div class="site-log-list">
              {content().plugins.rows.map((row: [string, string, string, string]) => (
                <article class="site-log-row">
                  <span class="meta">{row[0]}</span>
                  <div>
                    <h3>{row[1]}</h3>
                    <p>{row[2]}</p>
                  </div>
                  <span class="meta">{row[3]}</span>
                </article>
              ))}
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
                <h2>{content().resources.title}</h2>
              </div>
              <p>{content().resources.body}</p>
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
                <h3>{content().resources.cards[0][0]}</h3>
                <p>{content().resources.cards[0][1]}</p>
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
                <h3>{content().resources.cards[1][0]}</h3>
                <p>{content().resources.cards[1][1]}</p>
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
                <h3>{content().resources.cards[2][0]}</h3>
                <p>{content().resources.cards[2][1]}</p>
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
            <h2>{content().cta.title}</h2>
            <p class="site-lead" style="margin-inline: auto">
              {content().cta.body}
            </p>
            <div class="site-cta-row" style="justify-content: center">
              <A class="btn btn-primary" href="/download">
                {content().cta.primary}
              </A>
              <A class="btn btn-secondary" href="/docs">
                {content().cta.secondary}
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
                  showToast(i18n.t("waitlist.invalidEmail"))
                  return
                }
                form.reset()
                showToast(i18n.t("waitlist.success"))
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
                {i18n.t("waitlist.submit")}
              </button>
            </form>
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
              value={content().command.query}
              aria-label="命令搜索示例"
            />
            <span class="kbd kbd-inline">Esc</span>
          </div>
          <div class="palette-list">
            <div class="palette-item active">
              <span class="kbd kbd-inline">{content().command.items[0][0]}</span>
              <div>
                <strong>{content().command.items[0][1]}</strong>
                <br />
                <span>{content().command.items[0][2]}</span>
              </div>
              <span class="meta">{content().command.items[0][3]}</span>
            </div>
            <div class="palette-item">
              <span class="kbd kbd-inline">{content().command.items[1][0]}</span>
              <div>
                <strong>{content().command.items[1][1]}</strong>
                <br />
                <span>{content().command.items[1][2]}</span>
              </div>
              <span class="meta">{content().command.items[1][3]}</span>
            </div>
            <div class="palette-item">
              <span class="kbd kbd-inline">{content().command.items[2][0]}</span>
              <div>
                <strong>{content().command.items[2][1]}</strong>
                <br />
                <span>{content().command.items[2][2]}</span>
              </div>
              <span class="meta">{content().command.items[2][3]}</span>
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
