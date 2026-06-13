import { A } from "@solidjs/router"

import type { HomePageContent } from "../homePrototypeContent"
import { WorkbenchPreview } from "./WorkbenchPreview"

export function HeroSection(props: { content: HomePageContent }) {
  return (
    <section class="site-section site-hero" data-od-id="hero" data-component="SiteHero">
      <div class="site-container site-hero-grid">
        <div class="site-hero-copy">
          <p class="site-eyebrow">PLUGIN-FIRST NEW TAB</p>
          <h1>{props.content.hero.title}</h1>
          <p class="site-lead">{props.content.hero.lead}</p>
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
              {props.content.hero.primaryCta}
            </A>
            <A class="btn btn-secondary" href="/docs">
              {props.content.hero.secondaryCta}
            </A>
          </div>
          <div class="site-chip-row" aria-label="产品边界">
            {props.content.hero.chips.map((chip: string) => (
              <span class="chip site-chip">{chip}</span>
            ))}
          </div>
        </div>

        <WorkbenchPreview content={props.content} />
      </div>
    </section>
  )
}
