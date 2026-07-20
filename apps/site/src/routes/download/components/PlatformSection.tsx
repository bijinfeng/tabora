import { A } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"
import type { DownloadPageContent } from "../downloadPrototypeContent"

const styles = stylex.create({
  section: {
    borderTop: "1px solid rgb(var(--tbr-color-line))",
    paddingBlock: 72,
    "@media (max-width: 560px)": {
      paddingBlock: 48,
    },
  },
  container: {
    marginInline: "auto",
    width: "min(calc(100% - 64px), 1180px)",
    "@media (max-width: 560px)": {
      width: "min(calc(100% - 32px), 1180px)",
    },
  },
  head: {
    alignItems: "end",
    display: "grid",
    gap: 48,
    gridTemplateColumns: "minmax(0, 0.7fr) minmax(260px, 0.3fr)",
    marginBottom: 36,
    "@media (max-width: 920px)": {
      gap: 16,
      gridTemplateColumns: "1fr",
    },
  },
  eyebrow: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    fontWeight: 650,
    margin: 0,
  },
  title: {
    fontSize: 24,
    margin: "6px 0 0",
  },
  body: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  stats: {
    backgroundColor: "rgb(var(--tbr-color-line))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    display: "grid",
    gap: 1,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    marginBottom: 32,
    overflow: "hidden",
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  stat: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    display: "grid",
    gap: 5,
    minHeight: 104,
    padding: 18,
  },
  statValue: {
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 24,
  },
  statLabel: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
  },
  grid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    "@media (max-width: 920px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    alignContent: "start",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    display: "grid",
    gap: 14,
    minHeight: 220,
    padding: 18,
  },
  featured: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-accent))",
  },
  mark: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    display: "grid",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
    fontWeight: 760,
    height: 42,
    placeItems: "center",
    width: 42,
  },
  cardTitle: {
    fontSize: 16,
    margin: 0,
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: "auto",
  },
  badge: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-accent))",
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 650,
    minHeight: 22,
    paddingInline: 8,
  },
  button: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text))",
    display: "inline-flex",
    fontSize: 14,
    fontWeight: 620,
    justifyContent: "center",
    minHeight: 38,
    paddingInline: 14,
    textDecoration: "none",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
  },
})

export function PlatformSection(props: { content: DownloadPageContent }) {
  return (
    <section
      {...stylex.attrs(styles.section)}
      id="platforms"
      data-od-id="platforms"
      data-component="SiteDownloadCard"
    >
      <div {...stylex.attrs(styles.container)}>
        <div {...stylex.attrs(styles.head)}>
          <div>
            <p {...stylex.attrs(styles.eyebrow)}>PLATFORMS</p>
            <h2 {...stylex.attrs(styles.title)}>{props.content.platforms.title}</h2>
          </div>
          <p {...stylex.attrs(styles.body)}>{props.content.platforms.body}</p>
        </div>

        <div {...stylex.attrs(styles.stats)} aria-label="平台信息">
          {props.content.platforms.stats.map((item: [string, string]) => (
            <div {...stylex.attrs(styles.stat)}>
              <strong {...stylex.attrs(styles.statValue)}>{item[0]}</strong>
              <span {...stylex.attrs(styles.statLabel)}>{item[1]}</span>
            </div>
          ))}
        </div>

        <div {...stylex.attrs(styles.grid)}>
          {props.content.platforms.cards.map(
            (card: [string, string, string, [string, string]], index: number) => (
              <article {...stylex.attrs(styles.card, index === 0 && styles.featured)}>
                <span {...stylex.attrs(styles.mark)}>{card[0]}</span>
                <h3 {...stylex.attrs(styles.cardTitle)}>{card[1]}</h3>
                <p {...stylex.attrs(styles.body)}>{card[2]}</p>
                <div {...stylex.attrs(styles.actions)}>
                  {index === 2 ? (
                    <>
                      <A {...stylex.attrs(styles.button)} href="/docs/quickstart">
                        {card[3][0]}
                      </A>
                      <span {...stylex.attrs(styles.badge)}>{card[3][1]}</span>
                    </>
                  ) : (
                    <>
                      <span {...stylex.attrs(styles.badge)}>{card[3][0]}</span>
                      <span {...stylex.attrs(styles.badge)}>{card[3][1]}</span>
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
