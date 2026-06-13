import { A } from "@solidjs/router"
import type { DownloadPageContent } from "../downloadPrototypeContent"

export function DownloadHero(props: { content: DownloadPageContent }) {
  return (
    <section
      class="site-section site-page-hero"
      data-od-id="download-hero"
      data-component="SiteHero SiteDownloadPanel"
    >
      <div class="site-container site-page-grid">
        <div class="site-page-copy">
          <p class="site-eyebrow">DOWNLOAD TABORA</p>
          <h1>{props.content.hero.title}</h1>
          <p class="site-lead">{props.content.hero.lead}</p>
          <div class="site-cta-row">
            <a class="btn btn-primary" href="#platforms">
              {props.content.hero.primary}
            </a>
            <A class="btn btn-secondary" href="/docs/quickstart">
              {props.content.hero.secondary}
            </A>
          </div>
        </div>

        <aside class="download-panel" aria-label="发布通道">
          <div class="download-panel-head">
            <span>release channel</span>
            <span>tabora.newtab</span>
          </div>
          <div class="download-panel-body">
            {props.content.panel.rows.map((row: [string, string, string]) => (
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
  )
}
