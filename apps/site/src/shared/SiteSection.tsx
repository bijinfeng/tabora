import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import type { XStyle } from "./stylex"

export const siteSectionStyles = stylex.create({
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
})

export function SiteSection(props: {
  children: JSX.Element
  sectionAttrs?: Record<string, unknown>
  sectionXstyle?: XStyle
  containerXstyle?: XStyle
}) {
  return (
    <section
      {...stylex.attrs(siteSectionStyles.section, props.sectionXstyle)}
      {...props.sectionAttrs}
    >
      <div {...stylex.attrs(siteSectionStyles.container, props.containerXstyle)}>
        {props.children}
      </div>
    </section>
  )
}

export function SiteSectionHeader(props: {
  eyebrow: JSX.Element
  title: JSX.Element
  body: JSX.Element
  headXstyle?: XStyle
  eyebrowXstyle?: XStyle
  titleXstyle?: XStyle
  bodyXstyle?: XStyle
}) {
  return (
    <div {...stylex.attrs(siteSectionStyles.head, props.headXstyle)}>
      <div>
        <p {...stylex.attrs(siteSectionStyles.eyebrow, props.eyebrowXstyle)}>{props.eyebrow}</p>
        <h2 {...stylex.attrs(siteSectionStyles.title, props.titleXstyle)}>{props.title}</h2>
      </div>
      <p {...stylex.attrs(siteSectionStyles.body, props.bodyXstyle)}>{props.body}</p>
    </div>
  )
}
