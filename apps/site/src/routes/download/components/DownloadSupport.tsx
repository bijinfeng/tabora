import { A } from "@solidjs/router"
import type { DownloadPageContent } from "../downloadPrototypeContent"

export function DownloadSupport(props: {
  content: DownloadPageContent
  openFaq: ReadonlySet<number>
  toggleFaq: (index: number) => void
}) {
  return (
    <>
      <section class="site-section" data-od-id="support" data-component="SiteSupportTable">
        <div class="site-container">
          <div class="site-section-head">
            <div>
              <p class="site-eyebrow">SUPPORT</p>
              <h2>{props.content.support.title}</h2>
            </div>
            <p>{props.content.support.body}</p>
          </div>

          <div class="support-table" aria-label="平台支持范围">
            {props.content.support.rows.map((row: [string, string, string]) => (
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
              <h2>{props.content.faq.title}</h2>
            </div>
            <p>{props.content.faq.body}</p>
          </div>

          <div class="faq-list" aria-label="常见问题">
            {props.content.faq.items.map((item: [string, string], index: number) => (
              <div class="faq-item" classList={{ open: props.openFaq.has(index) }} data-faq-item>
                <button
                  class="faq-trigger"
                  type="button"
                  data-faq-trigger
                  aria-expanded={props.openFaq.has(index)}
                  onClick={() => props.toggleFaq(index)}
                >
                  {item[0]}
                  <span class="faq-icon" aria-hidden="true">
                    +
                  </span>
                </button>
                <div class="faq-body" data-faq-body hidden={!props.openFaq.has(index)}>
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
          <h2>{props.content.cta.title}</h2>
          <p class="site-lead" style="margin-inline: auto">
            {props.content.cta.body}
          </p>
          <div class="site-cta-row" style="justify-content: center">
            <A class="btn btn-primary" href="/docs">
              {props.content.cta.primary}
            </A>
            <A class="btn btn-secondary" href="/">
              {props.content.cta.secondary}
            </A>
          </div>
        </div>
      </section>
    </>
  )
}
