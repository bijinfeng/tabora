import { A } from "@solidjs/router"
import type { SiteI18nApi } from "../../../app/AppShell"
import type { HomePageContent } from "../homePrototypeContent"

export function FeatureSections(props: {
  content: HomePageContent
  i18n: SiteI18nApi
  showToast: (message: string) => void
}) {
  return (
    <>
      <section class="site-section" data-od-id="stats" data-component="SiteStatStrip">
        <div class="site-container">
          <div class="site-stat-strip" aria-label="产品数据">
            {props.content.stats.map((item: [string, string]) => (
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
              <h2>{props.content.featureHead.title}</h2>
            </div>
            <p>{props.content.featureHead.body}</p>
          </div>
          <div class="site-feature-grid">
            {props.content.features.map((feature: [string, string], index: number) => (
              <article class="site-feature">
                <div class="site-feature-mark">
                  <FeatureIcon index={index} />
                </div>
                <h3>{feature[0]}</h3>
                <p>{feature[1]}</p>
              </article>
            ))}
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
            <h2>{props.content.architecture.title}</h2>
            {props.content.architecture.principles.map((item: [string, string]) => (
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
            {props.content.architecture.matrix.map((row: [string, string, string, string]) => (
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
              <h2>{props.content.plugins.title}</h2>
            </div>
            <p>{props.content.plugins.body}</p>
          </div>
          <div class="site-log-list">
            {props.content.plugins.rows.map((row: [string, string, string, string]) => (
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
              <h2>{props.content.resources.title}</h2>
            </div>
            <p>{props.content.resources.body}</p>
          </div>
          <div class="site-feature-grid">
            <ResourceCard
              href="/download"
              card={props.content.resources.cards[0]}
              icon="download"
            />
            <ResourceCard href="/docs" card={props.content.resources.cards[1]} icon="docs" />
            <ResourceCard
              href="/docs/components"
              card={props.content.resources.cards[2]}
              icon="components"
            />
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
          <h2>{props.content.cta.title}</h2>
          <p class="site-lead" style="margin-inline: auto">
            {props.content.cta.body}
          </p>
          <div class="site-cta-row" style="justify-content: center">
            <A class="btn btn-primary" href="/download">
              {props.content.cta.primary}
            </A>
            <A class="btn btn-secondary" href="/docs">
              {props.content.cta.secondary}
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
                props.showToast(props.i18n.t("waitlist.invalidEmail"))
                return
              }
              form.reset()
              props.showToast(props.i18n.t("waitlist.success"))
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
              {props.i18n.t("waitlist.submit")}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}

function FeatureIcon(props: { index: number }) {
  if (props.index === 1) {
    return (
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
    )
  }

  if (props.index === 2) {
    return (
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
    )
  }

  return (
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
  )
}

function ResourceCard(props: {
  href: string
  card: [string, string]
  icon: "download" | "docs" | "components"
}) {
  return (
    <A class="site-feature" href={props.href}>
      <div class="site-feature-mark" aria-hidden="true">
        <ResourceIcon icon={props.icon} />
      </div>
      <h3>{props.card[0]}</h3>
      <p>{props.card[1]}</p>
    </A>
  )
}

function ResourceIcon(props: { icon: "download" | "docs" | "components" }) {
  if (props.icon === "download") {
    return (
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
    )
  }

  if (props.icon === "components") {
    return (
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
    )
  }

  return (
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
  )
}
