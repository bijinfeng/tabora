import { A } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"
import { For, type JSX } from "solid-js"

import { componentDocsCategories } from "@tabora/ui/component-docs"

const styles = stylex.create({
  page: {
    alignItems: "start",
    display: "grid",
    gap: 28,
    gridTemplateColumns: "230px minmax(0, 1fr)",
    paddingBlock: "18px 72px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  sidebar: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    maxHeight: "calc(100svh - 104px)",
    overflow: "auto",
    padding: 14,
    position: "sticky",
    top: 86,
    "@media (max-width: 900px)": {
      maxHeight: 320,
      position: "static",
    },
  },
  title: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 14,
    fontWeight: 760,
    marginBottom: 10,
  },
  section: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
    fontWeight: 760,
    padding: "12px 4px 4px",
    textTransform: "uppercase",
  },
  link: {
    borderRadius: "var(--tbr-radius-2)",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "block",
    fontSize: 12,
    fontWeight: 560,
    minHeight: 28,
    paddingBlock: 6,
    paddingInline: 8,
    textDecoration: "none",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
  },
  homeLink: {
    fontWeight: 680,
  },
  content: {
    display: "grid",
    gap: 28,
    minWidth: 0,
  },
})

export function DocsShell(props: { children: JSX.Element }) {
  return (
    <main {...stylex.attrs(styles.page)} data-docs-shell>
      <aside {...stylex.attrs(styles.sidebar)} aria-label="基础组件目录" data-docs-sidebar>
        <div {...stylex.attrs(styles.title)}>基础组件</div>
        <A {...stylex.attrs(styles.link, styles.homeLink)} href="/docs" end>
          文档总览
        </A>
        <A {...stylex.attrs(styles.link, styles.homeLink)} href="/docs/components">
          全部组件
        </A>
        <For each={componentDocsCategories}>
          {(category) => (
            <section>
              <div {...stylex.attrs(styles.section)}>{category.title}</div>
              <For each={category.items}>
                {(item) => (
                  <A {...stylex.attrs(styles.link)} href={`/docs/components/${item.id}`}>
                    {item.name}
                  </A>
                )}
              </For>
            </section>
          )}
        </For>
      </aside>
      <div {...stylex.attrs(styles.content)}>{props.children}</div>
    </main>
  )
}
