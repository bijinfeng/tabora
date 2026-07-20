import { Badge } from "@tabora/ui"
import { ComponentDocDemo, type ComponentDocItem } from "@tabora/ui/component-docs"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    borderTop: "1px solid rgb(var(--tbr-color-line))",
    display: "grid",
    gap: 14,
    paddingTop: 14,
    scrollMarginTop: 88,
  },
  head: {
    alignItems: "start",
    display: "grid",
    gap: 12,
    gridTemplateColumns: "minmax(0, 1fr) auto",
    "@media (max-width: 560px)": {
      gridTemplateColumns: "1fr",
    },
  },
  title: {
    fontSize: 24,
    lineHeight: 1.22,
    margin: "0 0 6px",
  },
  body: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    lineHeight: 1.62,
    margin: 0,
  },
  grid: {
    alignItems: "stretch",
    display: "grid",
    gap: 14,
    gridTemplateColumns: "minmax(0, 1.04fr) minmax(280px, 0.96fr)",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  panel: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    minWidth: 0,
    overflow: "hidden",
  },
  demoPanel: {
    alignContent: "start",
    display: "grid",
    gap: 12,
    padding: 14,
  },
  codePanel: {
    display: "grid",
    gridTemplateRows: "auto 1fr",
  },
  label: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
    fontWeight: 760,
    textTransform: "uppercase",
  },
  codeLabel: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    paddingBlock: 12,
    paddingInline: 14,
  },
  render: {
    alignItems: "start",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px dashed rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    display: "grid",
    gap: 12,
    minWidth: 0,
    padding: 14,
  },
  pre: {
    margin: 0,
    overflow: "auto",
    padding: 14,
  },
  code: {
    color: "rgb(var(--tbr-color-text))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
    lineHeight: 1.65,
    whiteSpace: "pre",
  },
})

export function ComponentDocCard(props: { doc: ComponentDocItem }) {
  return (
    <section {...stylex.attrs(styles.root)} id={props.doc.id} data-component-doc>
      <div {...stylex.attrs(styles.head)}>
        <div>
          <h2 {...stylex.attrs(styles.title)}>{props.doc.title}</h2>
          <p {...stylex.attrs(styles.body)}>{props.doc.purpose}</p>
        </div>
        <Badge variant="accent">real render</Badge>
      </div>
      <div {...stylex.attrs(styles.grid)}>
        <div {...stylex.attrs(styles.panel, styles.demoPanel)}>
          <div {...stylex.attrs(styles.label)}>使用方案</div>
          <p {...stylex.attrs(styles.body)}>{props.doc.usage}</p>
          <div {...stylex.attrs(styles.render)} data-docs-demo>
            <ComponentDocDemo id={props.doc.id} />
          </div>
        </div>
        <div {...stylex.attrs(styles.panel, styles.codePanel)}>
          <div {...stylex.attrs(styles.label, styles.codeLabel)}>代码示例</div>
          <pre {...stylex.attrs(styles.pre)}>
            <code {...stylex.attrs(styles.code)}>{props.doc.code}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}
