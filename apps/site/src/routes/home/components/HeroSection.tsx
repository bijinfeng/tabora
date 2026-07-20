import { A } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"

import type { HomePageContent } from "../homePrototypeContent"
import { WorkbenchPreview } from "./WorkbenchPreview"

const styles = stylex.create({
  section: {
    alignItems: "center",
    display: "grid",
    minHeight: "calc(100svh - 64px)",
    paddingBlock: "64px 40px",
    "@media (max-width: 920px)": {
      minHeight: "auto",
      paddingBlock: "48px 28px",
    },
  },
  container: {
    alignItems: "center",
    display: "grid",
    gap: 48,
    gridTemplateColumns: "minmax(0, 0.86fr) minmax(520px, 1.14fr)",
    marginInline: "auto",
    width: "min(calc(100% - 64px), 1180px)",
    "@media (max-width: 1180px)": {
      gridTemplateColumns: "1fr",
    },
    "@media (max-width: 560px)": {
      width: "min(calc(100% - 32px), 1180px)",
    },
  },
  copy: {
    display: "grid",
    gap: 20,
  },
  eyebrow: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    fontWeight: 650,
    letterSpacing: 0,
    margin: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.2,
    margin: 0,
    maxWidth: "16ch",
  },
  lead: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 16,
    lineHeight: 1.6,
    margin: 0,
    maxWidth: "58ch",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  button: {
    alignItems: "center",
    border: "1px solid transparent",
    borderRadius: "var(--tbr-radius-control)",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 620,
    gap: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingInline: 16,
    textDecoration: "none",
    whiteSpace: "nowrap",
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
  },
  primary: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-inverse))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent-hover))",
      borderColor: "rgb(var(--tbr-color-accent-hover))",
    },
  },
  secondary: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontSize: 12,
    fontWeight: 560,
    minHeight: 28,
    paddingInline: 10,
  },
})

export function HeroSection(props: { content: HomePageContent }) {
  return (
    <section {...stylex.attrs(styles.section)} data-od-id="hero" data-component="SiteHero">
      <div {...stylex.attrs(styles.container)}>
        <div {...stylex.attrs(styles.copy)}>
          <p {...stylex.attrs(styles.eyebrow)}>PLUGIN-FIRST NEW TAB</p>
          <h1 {...stylex.attrs(styles.title)}>{props.content.hero.title}</h1>
          <p {...stylex.attrs(styles.lead)}>{props.content.hero.lead}</p>
          <div {...stylex.attrs(styles.actionRow)}>
            <A {...stylex.attrs(styles.button, styles.primary)} href="/download">
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
            <A {...stylex.attrs(styles.button, styles.secondary)} href="/docs">
              {props.content.hero.secondaryCta}
            </A>
          </div>
          <div {...stylex.attrs(styles.chipRow)} aria-label="产品边界">
            {props.content.hero.chips.map((chip: string) => (
              <span {...stylex.attrs(styles.chip)}>{chip}</span>
            ))}
          </div>
        </div>

        <WorkbenchPreview content={props.content} />
      </div>
    </section>
  )
}
