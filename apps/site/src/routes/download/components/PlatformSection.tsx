import { A } from "@solidjs/router"
import type { DownloadPageContent } from "../downloadPrototypeContent"

export function PlatformSection(props: { content: DownloadPageContent }) {
  return (
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
            <h2>{props.content.platforms.title}</h2>
          </div>
          <p>{props.content.platforms.body}</p>
        </div>

        <div class="site-stat-strip" aria-label="平台信息" style="margin-bottom: 32px">
          {props.content.platforms.stats.map((item: [string, string]) => (
            <div class="site-stat">
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </div>
          ))}
        </div>

        <div class="download-grid">
          {props.content.platforms.cards.map(
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
  )
}
