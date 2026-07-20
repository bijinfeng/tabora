import { A } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"
import { sx } from "../../../shared/stylex"
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
    lineHeight: 1.65,
    margin: 0,
  },
  supportTable: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    overflow: "hidden",
  },
  supportRow: {
    alignItems: "center",
    borderTop: "1px solid rgb(var(--tbr-color-line))",
    display: "grid",
    gap: 16,
    gridTemplateColumns: "minmax(140px, 0.52fr) 1fr auto",
    minHeight: 68,
    paddingBlock: 15,
    paddingInline: 18,
    "@media (max-width: 920px)": {
      alignItems: "start",
      gridTemplateColumns: "1fr",
    },
  },
  firstRow: {
    borderTopWidth: 0,
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
    width: "fit-content",
  },
  faqList: {
    borderTop: "1px solid rgb(var(--tbr-color-line))",
  },
  faqItem: {
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
  },
  faqTrigger: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    display: "flex",
    fontSize: 15,
    fontWeight: 620,
    gap: 16,
    justifyContent: "space-between",
    paddingBlock: 18,
    textAlign: "left",
    width: "100%",
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
  },
  faqIcon: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "50%",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "grid",
    flexShrink: 0,
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 14,
    height: 22,
    placeItems: "center",
    transition:
      "transform var(--tbr-dur-normal) var(--tbr-ease), background-color var(--tbr-dur-normal) var(--tbr-ease)",
    width: 22,
  },
  faqIconOpen: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "transparent",
    color: "rgb(var(--tbr-color-accent))",
    transform: "rotate(45deg)",
  },
  faqBody: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 14,
    lineHeight: 1.65,
    maxWidth: "72ch",
    paddingBottom: 20,
  },
  cta: {
    textAlign: "center",
  },
  ctaPanel: {
    display: "grid",
    gap: 18,
    marginInline: "auto",
    maxWidth: 660,
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
    justifyContent: "center",
  },
  button: {
    alignItems: "center",
    border: "1px solid transparent",
    borderRadius: "var(--tbr-radius-control)",
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
  },
  secondary: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text))",
  },
})

export function DownloadSupport(props: {
  content: DownloadPageContent
  openFaq: ReadonlySet<number>
  toggleFaq: (index: number) => void
}) {
  return (
    <>
      <section {...sx(styles.section)} data-od-id="support" data-component="SiteSupportTable">
        <div {...sx(styles.container)}>
          <div {...sx(styles.head)}>
            <div>
              <p {...sx(styles.eyebrow)}>SUPPORT</p>
              <h2 {...sx(styles.title)}>{props.content.support.title}</h2>
            </div>
            <p {...sx(styles.body)}>{props.content.support.body}</p>
          </div>

          <div {...sx(styles.supportTable)} aria-label="平台支持范围">
            {props.content.support.rows.map((row: [string, string, string], index: number) => (
              <div {...sx(styles.supportRow, index === 0 && styles.firstRow)}>
                <strong>{row[0]}</strong>
                <span {...sx(styles.body)}>{row[1]}</span>
                <span {...sx(styles.badge)}>{row[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section {...sx(styles.section)} data-od-id="faq" data-component="SiteFAQ">
        <div {...sx(styles.container)}>
          <div {...sx(styles.head)}>
            <div>
              <p {...sx(styles.eyebrow)}>FAQ</p>
              <h2 {...sx(styles.title)}>{props.content.faq.title}</h2>
            </div>
            <p {...sx(styles.body)}>{props.content.faq.body}</p>
          </div>

          <div {...sx(styles.faqList)} aria-label="常见问题">
            {props.content.faq.items.map((item: [string, string], index: number) => (
              <div {...sx(styles.faqItem)} data-faq-item data-site-faq-item>
                <button
                  {...sx(styles.faqTrigger)}
                  type="button"
                  data-faq-trigger
                  aria-expanded={props.openFaq.has(index)}
                  onClick={() => props.toggleFaq(index)}
                >
                  {item[0]}
                  <span
                    {...sx(styles.faqIcon, props.openFaq.has(index) && styles.faqIconOpen)}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div {...sx(styles.faqBody)} data-faq-body hidden={!props.openFaq.has(index)}>
                  <p {...sx(styles.body)}>{item[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        {...sx(styles.section, styles.cta)}
        data-od-id="download-cta"
        data-component="SiteCTA"
      >
        <div {...sx(styles.container, styles.ctaPanel)}>
          <p {...sx(styles.eyebrow)}>NEXT STEP</p>
          <h2 {...sx(styles.title)}>{props.content.cta.title}</h2>
          <p {...sx(styles.lead)}>{props.content.cta.body}</p>
          <div {...sx(styles.actions)}>
            <A {...sx(styles.button, styles.primary)} href="/docs">
              {props.content.cta.primary}
            </A>
            <A {...sx(styles.button, styles.secondary)} href="/">
              {props.content.cta.secondary}
            </A>
          </div>
        </div>
      </section>
    </>
  )
}
