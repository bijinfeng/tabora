import { A } from "@solidjs/router"
import { Button } from "@tabora/ui/button"
import { Input } from "@tabora/ui/input"
import * as stylex from "@stylexjs/stylex"
import { createSignal } from "solid-js"
import { getSiteHref, type SiteI18nApi } from "../../../app/AppShell"
import { SiteSection, SiteSectionHeader } from "../../../shared/SiteSection"
import type { HomePageContent } from "../homePrototypeContent"

const styles = stylex.create({
  eyebrow: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    fontWeight: 650,
    margin: 0,
    textTransform: "uppercase",
  },
  heading: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.25,
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
    color: "rgb(var(--tbr-color-text))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 24,
    lineHeight: 1,
  },
  statLabel: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
  },
  featureGrid: {
    display: "grid",
    gap: 22,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    "@media (max-width: 920px)": {
      gridTemplateColumns: "1fr",
    },
  },
  feature: {
    alignContent: "start",
    borderTop: "1px solid rgb(var(--tbr-color-line-strong))",
    color: "rgb(var(--tbr-color-text))",
    display: "grid",
    gap: 14,
    paddingTop: 20,
    textDecoration: "none",
  },
  featureMark: {
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text))",
    display: "grid",
    height: 36,
    placeItems: "center",
    width: 36,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 650,
    margin: 0,
  },
  split: {
    alignItems: "start",
    display: "grid",
    gap: 48,
    gridTemplateColumns: "minmax(0, 0.92fr) minmax(440px, 1.08fr)",
    "@media (max-width: 1180px)": {
      gridTemplateColumns: "1fr",
    },
  },
  principles: {
    display: "grid",
    gap: 12,
  },
  principle: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    padding: 18,
  },
  principleTitle: {
    display: "block",
    fontSize: 14,
    marginBottom: 6,
  },
  matrix: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    overflow: "hidden",
    "@media (max-width: 920px)": {
      backgroundColor: "transparent",
      borderWidth: 0,
      display: "grid",
      gap: 10,
    },
  },
  matrixRow: {
    borderTop: "1px solid rgb(var(--tbr-color-line))",
    display: "grid",
    gridTemplateColumns: "0.82fr 1.18fr 1fr",
    "@media (max-width: 920px)": {
      backgroundColor: "rgb(var(--tbr-color-surface))",
      border: "1px solid rgb(var(--tbr-color-line))",
      borderRadius: "var(--tbr-radius-card)",
      gridTemplateColumns: "1fr",
      overflow: "hidden",
    },
  },
  matrixFirstRow: {
    borderTopWidth: 0,
  },
  matrixHead: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    fontWeight: 650,
    textTransform: "uppercase",
    "@media (max-width: 920px)": {
      display: "none",
    },
  },
  matrixCell: {
    borderRight: "1px solid rgb(var(--tbr-color-line))",
    minWidth: 0,
    padding: 16,
    "@media (max-width: 920px)": {
      borderBottom: "1px solid rgb(var(--tbr-color-line))",
      borderRightWidth: 0,
    },
  },
  matrixLastCell: {
    borderRightWidth: 0,
    "@media (max-width: 920px)": {
      borderBottomWidth: 0,
    },
  },
  matrixTitle: {
    display: "block",
    fontSize: 13,
    marginBottom: 5,
  },
  logList: {
    borderTop: "1px solid rgb(var(--tbr-color-line))",
  },
  logRow: {
    alignItems: "baseline",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    display: "grid",
    gap: 24,
    gridTemplateColumns: "180px 1fr 160px",
    paddingBlock: 22,
    "@media (max-width: 920px)": {
      gap: 8,
      gridTemplateColumns: "1fr",
    },
  },
  logTitle: {
    fontSize: 16,
    margin: 0,
  },
  meta: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
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
  centeredLead: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 16,
    lineHeight: 1.6,
    margin: 0,
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  actionButton: {
    fontSize: 14,
    height: 40,
    paddingInline: 16,
  },
  waitlist: {
    display: "flex",
    gap: 10,
    margin: "12px auto 0",
    maxWidth: 520,
    "@media (max-width: 560px)": {
      flexDirection: "column",
    },
  },
  input: {
    flex: 1,
    height: 42,
    minWidth: 0,
    paddingInline: 13,
  },
})

export function FeatureSections(props: {
  content: HomePageContent
  i18n: SiteI18nApi
  showToast: (message: string) => void
}) {
  const [email, setEmail] = createSignal("")

  return (
    <>
      <SiteSection sectionAttrs={{ "data-od-id": "stats", "data-component": "SiteStatStrip" }}>
        <div {...stylex.attrs(styles.stats)} aria-label="产品数据">
          {props.content.stats.map((item: [string, string]) => (
            <div {...stylex.attrs(styles.stat)}>
              <strong {...stylex.attrs(styles.statValue)}>{item[0]}</strong>
              <span {...stylex.attrs(styles.statLabel)}>{item[1]}</span>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection sectionAttrs={{ "data-od-id": "features", "data-component": "SiteFeatureGrid" }}>
        <SiteSectionHeader
          eyebrow="WHAT CHANGES"
          title={props.content.featureHead.title}
          body={props.content.featureHead.body}
          eyebrowXstyle={styles.eyebrow}
          titleXstyle={styles.heading}
        />
        <div {...stylex.attrs(styles.featureGrid)}>
          {props.content.features.map((feature: [string, string], index: number) => (
            <article {...stylex.attrs(styles.feature)}>
              <div {...stylex.attrs(styles.featureMark)}>
                <FeatureIcon index={index} />
              </div>
              <h3 {...stylex.attrs(styles.featureTitle)}>{feature[0]}</h3>
              <p {...stylex.attrs(styles.body)}>{feature[1]}</p>
            </article>
          ))}
        </div>
      </SiteSection>

      <SiteSection
        sectionAttrs={{
          id: "architecture",
          "data-od-id": "architecture",
          "data-component": "SiteProof",
        }}
        containerXstyle={styles.split}
      >
        <div {...stylex.attrs(styles.principles)}>
          <p {...stylex.attrs(styles.eyebrow)}>ARCHITECTURE POSTURE</p>
          <h2 {...stylex.attrs(styles.heading)}>{props.content.architecture.title}</h2>
          {props.content.architecture.principles.map((item: [string, string]) => (
            <div {...stylex.attrs(styles.principle)}>
              <strong {...stylex.attrs(styles.principleTitle)}>{item[0]}</strong>
              <span {...stylex.attrs(styles.body)}>{item[1]}</span>
            </div>
          ))}
        </div>

        <div {...stylex.attrs(styles.matrix)} role="table" aria-label="插件类型自由度与约束">
          <div
            {...stylex.attrs(styles.matrixRow, styles.matrixFirstRow, styles.matrixHead)}
            role="row"
          >
            <div {...stylex.attrs(styles.matrixCell)} role="columnheader">
              类型
            </div>
            <div {...stylex.attrs(styles.matrixCell)} role="columnheader">
              自由度
            </div>
            <div {...stylex.attrs(styles.matrixCell, styles.matrixLastCell)} role="columnheader">
              硬约束
            </div>
          </div>
          {props.content.architecture.matrix.map((row: [string, string, string, string]) => (
            <div {...stylex.attrs(styles.matrixRow)} role="row">
              <div {...stylex.attrs(styles.matrixCell)} role="cell">
                <strong {...stylex.attrs(styles.matrixTitle)}>{row[0]}</strong>
                <span {...stylex.attrs(styles.body)}>{row[1]}</span>
              </div>
              <div {...stylex.attrs(styles.matrixCell)} role="cell">
                <span {...stylex.attrs(styles.body)}>{row[2]}</span>
              </div>
              <div {...stylex.attrs(styles.matrixCell, styles.matrixLastCell)} role="cell">
                <span {...stylex.attrs(styles.body)}>{row[3]}</span>
              </div>
            </div>
          ))}
        </div>
      </SiteSection>

      <SiteSection
        sectionAttrs={{
          id: "plugins",
          "data-od-id": "plugins",
          "data-component": "SiteProof",
        }}
      >
        <SiteSectionHeader
          eyebrow="OFFICIAL PLUGINS"
          title={props.content.plugins.title}
          body={props.content.plugins.body}
          eyebrowXstyle={styles.eyebrow}
          titleXstyle={styles.heading}
        />
        <div {...stylex.attrs(styles.logList)}>
          {props.content.plugins.rows.map((row: [string, string, string, string]) => (
            <article {...stylex.attrs(styles.logRow)}>
              <span {...stylex.attrs(styles.meta)}>{row[0]}</span>
              <div>
                <h3 {...stylex.attrs(styles.logTitle)}>{row[1]}</h3>
                <p {...stylex.attrs(styles.body)}>{row[2]}</p>
              </div>
              <span {...stylex.attrs(styles.meta)}>{row[3]}</span>
            </article>
          ))}
        </div>
      </SiteSection>

      <SiteSection
        sectionAttrs={{
          id: "resources",
          "data-od-id": "resources",
          "data-component": "SiteFeatureGrid",
        }}
      >
        <SiteSectionHeader
          eyebrow="GET STARTED"
          title={props.content.resources.title}
          body={props.content.resources.body}
          eyebrowXstyle={styles.eyebrow}
          titleXstyle={styles.heading}
        />
        <div {...stylex.attrs(styles.featureGrid)}>
          <ResourceCard href="/download" card={props.content.resources.cards[0]} icon="download" />
          <ResourceCard href="/docs" card={props.content.resources.cards[1]} icon="docs" />
          <ResourceCard
            href="/docs/components"
            card={props.content.resources.cards[2]}
            icon="components"
          />
        </div>
      </SiteSection>

      <SiteSection
        sectionAttrs={{
          id: "waitlist",
          "data-od-id": "cta-strip",
          "data-component": "SiteCTA SiteWaitlist",
        }}
        sectionXstyle={styles.cta}
        containerXstyle={styles.ctaPanel}
      >
        <p {...stylex.attrs(styles.eyebrow)}>NEXT REVIEW</p>
        <h2 {...stylex.attrs(styles.heading)}>{props.content.cta.title}</h2>
        <p {...stylex.attrs(styles.centeredLead)}>{props.content.cta.body}</p>
        <div {...stylex.attrs(styles.actionRow)}>
          <Button
            href={getSiteHref("/download")}
            size="md"
            variant="primary"
            xstyle={styles.actionButton}
          >
            {props.content.cta.primary}
          </Button>
          <Button
            href={getSiteHref("/docs")}
            size="md"
            variant="secondary"
            xstyle={styles.actionButton}
          >
            {props.content.cta.secondary}
          </Button>
        </div>
        <form
          {...stylex.attrs(styles.waitlist)}
          data-waitlist
          onSubmit={(event) => {
            event.preventDefault()
            if (!email().includes("@")) {
              props.showToast(props.i18n.t("waitlist.invalidEmail"))
              return
            }
            setEmail("")
            props.showToast(props.i18n.t("waitlist.success"))
          }}
        >
          <Input
            value={email()}
            onInput={setEmail}
            xstyle={styles.input}
            type="email"
            placeholder="name@example.com"
            aria-label="邮箱"
          />
          <Button size="md" variant="secondary" xstyle={styles.actionButton} type="submit">
            {props.i18n.t("waitlist.submit")}
          </Button>
        </form>
      </SiteSection>
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
    <A {...stylex.attrs(styles.feature)} href={props.href}>
      <div {...stylex.attrs(styles.featureMark)} aria-hidden="true">
        <ResourceIcon icon={props.icon} />
      </div>
      <h3 {...stylex.attrs(styles.featureTitle)}>{props.card[0]}</h3>
      <p {...stylex.attrs(styles.body)}>{props.card[1]}</p>
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
