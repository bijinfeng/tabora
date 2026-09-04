import * as stylex from "@stylexjs/stylex"
import type { SolidMarkdownComponents } from "solid-markdown"
import { TextPart } from "@tanstack/ai-solid/ui"

export const markdownStyles = stylex.create({
  paragraph: {
    marginBlock: 6,
    marginTop: 0,
  },
  heading: {
    fontWeight: 650,
    lineHeight: 1.35,
    marginBlock: 10,
    marginTop: 12,
  },
  h1: { fontSize: 18 },
  h2: { fontSize: 16 },
  h3: { fontSize: 14 },
  list: {
    marginBlock: 6,
    paddingInlineStart: 20,
  },
  listItem: {
    marginBlock: 2,
  },
  blockquote: {
    borderColor: "rgb(var(--tbr-color-line-strong))",
    borderLeftStyle: "solid",
    borderLeftWidth: 3,
    color: "rgb(var(--tbr-color-text-muted))",
    marginBlock: 8,
    marginInline: 0,
    paddingInlineStart: 10,
  },
  codeInline: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderRadius: 4,
    color: "rgb(var(--tbr-color-accent))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: "0.92em",
    paddingInline: 4,
  },
  codeBlock: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: 6,
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
    lineHeight: 1.5,
    marginBlock: 8,
    overflowX: "auto",
    padding: 10,
  },
  linkText: {
    color: "rgb(var(--tbr-color-accent))",
    textDecoration: "underline",
  },
  divider: {
    backgroundColor: "rgb(var(--tbr-color-line))",
    borderStyle: "none",
    borderWidth: 0,
    height: 1,
    marginBlock: 12,
  },
  table: {
    borderCollapse: "collapse",
    display: "block",
    fontSize: 13,
    marginBlock: 8,
    maxWidth: "100%",
    overflowX: "auto",
  },
  tableCell: {
    border: "1px solid rgb(var(--tbr-color-line))",
    padding: "4px 8px",
    textAlign: "left",
  },
})

/**
 * Markdown rendered with Tabora tokens. Only class and children are forwarded
 * so hast metadata (node, positions) never leaks onto DOM elements, and links
 * stay non-interactive — model output can never bypass the external-open
 * permission bridge.
 */
export const markdownComponents: SolidMarkdownComponents = {
  p: (props) => (
    <p class={props.class} {...stylex.attrs(markdownStyles.paragraph)}>
      {props.children}
    </p>
  ),
  h1: (props) => (
    <h1 class={props.class} {...stylex.attrs(markdownStyles.heading, markdownStyles.h1)}>
      {props.children}
    </h1>
  ),
  h2: (props) => (
    <h2 class={props.class} {...stylex.attrs(markdownStyles.heading, markdownStyles.h2)}>
      {props.children}
    </h2>
  ),
  h3: (props) => (
    <h3 class={props.class} {...stylex.attrs(markdownStyles.heading, markdownStyles.h3)}>
      {props.children}
    </h3>
  ),
  h4: (props) => (
    <h4 class={props.class} {...stylex.attrs(markdownStyles.heading)}>
      {props.children}
    </h4>
  ),
  h5: (props) => (
    <h5 class={props.class} {...stylex.attrs(markdownStyles.heading)}>
      {props.children}
    </h5>
  ),
  h6: (props) => (
    <h6 class={props.class} {...stylex.attrs(markdownStyles.heading)}>
      {props.children}
    </h6>
  ),
  ul: (props) => (
    <ul class={props.class} {...stylex.attrs(markdownStyles.list)}>
      {props.children}
    </ul>
  ),
  ol: (props) => (
    <ol class={props.class} {...stylex.attrs(markdownStyles.list)}>
      {props.children}
    </ol>
  ),
  li: (props) => (
    <li class={props.class} {...stylex.attrs(markdownStyles.listItem)}>
      {props.children}
    </li>
  ),
  blockquote: (props) => (
    <blockquote class={props.class} {...stylex.attrs(markdownStyles.blockquote)}>
      {props.children}
    </blockquote>
  ),
  pre: (props) => (
    <pre class={props.class} {...stylex.attrs(markdownStyles.codeBlock)}>
      {props.children}
    </pre>
  ),
  code: (props) => (
    <code class={props.class} {...stylex.attrs(markdownStyles.codeInline)}>
      {props.children}
    </code>
  ),
  a: (props) => (
    <span class={props.class} {...stylex.attrs(markdownStyles.linkText)}>
      {props.children}
    </span>
  ),
  hr: () => <hr {...stylex.attrs(markdownStyles.divider)} />,
  table: (props) => (
    <table class={props.class} {...stylex.attrs(markdownStyles.table)}>
      {props.children}
    </table>
  ),
  th: (props) => (
    <th class={props.class} {...stylex.attrs(markdownStyles.tableCell)}>
      {props.children}
    </th>
  ),
  td: (props) => (
    <td class={props.class} {...stylex.attrs(markdownStyles.tableCell)}>
      {props.children}
    </td>
  ),
}

export function AssistantMarkdown(props: { content: string }) {
  return <TextPart content={props.content} components={markdownComponents} />
}
