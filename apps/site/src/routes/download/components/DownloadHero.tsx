import { A } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"
import type { DownloadPageContent } from "../downloadPrototypeContent"

const styles = stylex.create({
  section: {
    paddingBlock: "64px 48px",
    "@media (max-width: 920px)": {
      paddingBlock: "48px 32px",
    },
  },
  grid: {
    alignItems: "end",
    display: "grid",
    gap: 48,
    gridTemplateColumns: "minmax(0, 0.9fr) minmax(420px, 1.1fr)",
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
    gap: 18,
  },
  eyebrow: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    fontWeight: 650,
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
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  button: {
    alignItems: "center",
    border: "1px solid transparent",
    borderRadius: "var(--tbr-radius-control)",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 620,
    justifyContent: "center",
    minHeight: 40,
    paddingInline: 16,
    textDecoration: "none",
  },
  primary: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-inverse))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent-hover))",
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
  panel: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line-strong))",
    borderRadius: "var(--tbr-radius-panel)",
    boxShadow: "var(--tbr-shadow-raised, var(--tbr-shadow-lg))",
    overflow: "hidden",
  },
  panelHead: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "flex",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    gap: 12,
    justifyContent: "space-between",
    minHeight: 42,
    paddingInline: 14,
  },
  panelBody: {
    backgroundColor: "rgb(var(--tbr-color-line))",
    display: "grid",
    gap: 1,
  },
  row: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    display: "grid",
    gap: 16,
    gridTemplateColumns: "1fr auto",
    minHeight: 86,
    padding: 18,
    "@media (max-width: 920px)": {
      alignItems: "start",
      gridTemplateColumns: "1fr",
    },
  },
  rowTitle: {
    fontSize: 16,
    margin: 0,
  },
  rowBody: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    margin: "5px 0 0",
  },
  badge: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-accent))",
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 650,
    justifyContent: "center",
    minHeight: 22,
    paddingInline: 8,
  },
})

export function DownloadHero(props: { content: DownloadPageContent }) {
  return (
    <section
      {...stylex.attrs(styles.section)}
      data-od-id="download-hero"
      data-component="SiteHero SiteDownloadPanel"
    >
      <div {...stylex.attrs(styles.grid)}>
        <div {...stylex.attrs(styles.copy)}>
          <p {...stylex.attrs(styles.eyebrow)}>DOWNLOAD TABORA</p>
          <h1 {...stylex.attrs(styles.title)}>{props.content.hero.title}</h1>
          <p {...stylex.attrs(styles.lead)}>{props.content.hero.lead}</p>
          <div {...stylex.attrs(styles.actions)}>
            <a {...stylex.attrs(styles.button, styles.primary)} href="#platforms">
              {props.content.hero.primary}
            </a>
            <A {...stylex.attrs(styles.button, styles.secondary)} href="/docs/quickstart">
              {props.content.hero.secondary}
            </A>
          </div>
        </div>

        <aside {...stylex.attrs(styles.panel)} aria-label="发布通道">
          <div {...stylex.attrs(styles.panelHead)}>
            <span>release channel</span>
            <span>tabora.newtab</span>
          </div>
          <div {...stylex.attrs(styles.panelBody)}>
            {props.content.panel.rows.map((row: [string, string, string]) => (
              <div {...stylex.attrs(styles.row)}>
                <div>
                  <h3 {...stylex.attrs(styles.rowTitle)}>{row[0]}</h3>
                  <p {...stylex.attrs(styles.rowBody)}>{row[1]}</p>
                </div>
                <span {...stylex.attrs(styles.badge)}>{row[2]}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
