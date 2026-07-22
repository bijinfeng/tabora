import * as stylex from "@stylexjs/stylex"
import { Button } from "@tabora/ui"

import type { DocsCodeBlock as DocsCodeBlockContent, DocsTable } from "../docsPageContent"

const styles = stylex.create({
  block: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    minWidth: 0,
    overflow: "hidden",
  },
  head: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text-subtle))",
    display: "flex",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    justifyContent: "space-between",
    minHeight: 38,
    paddingBlock: 8,
    paddingInline: 14,
  },
  copy: {
    fontSize: 11,
    height: 26,
    paddingInline: 9,
  },
  window: {
    minWidth: 0,
    overflow: "auto",
  },
  pre: {
    margin: 0,
    padding: 16,
  },
  code: {
    color: "rgb(var(--tbr-color-text))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
    lineHeight: 1.65,
    whiteSpace: "pre",
  },
  table: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderCollapse: "collapse",
    borderRadius: "var(--tbr-radius-card)",
    overflow: "hidden",
    width: "100%",
  },
  cell: {
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    lineHeight: 1.5,
    paddingBlock: 10,
    paddingInline: 12,
    textAlign: "left",
    verticalAlign: "top",
  },
  headingCell: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    color: "rgb(var(--tbr-color-text))",
    fontWeight: 680,
  },
  inlineCode: {
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
  },
})

export function DocsCodeBlock(props: { block: DocsCodeBlockContent }) {
  return (
    <div {...stylex.attrs(styles.block)} data-docs-code>
      <div {...stylex.attrs(styles.head)}>
        <span>{props.block.label}</span>
        <Button
          size="sm"
          variant="secondary"
          xstyle={styles.copy}
          data-copy-button
          data-copy={props.block.copyId}
          data-copy-default={props.block.copyLabel}
          data-copy-success={props.block.copiedLabel}
        >
          {props.block.copyLabel}
        </Button>
      </div>
      <div {...stylex.attrs(styles.window)}>
        <pre {...stylex.attrs(styles.pre)}>
          <code {...stylex.attrs(styles.code)} id={props.block.copyId}>
            {props.block.code}
          </code>
        </pre>
      </div>
    </div>
  )
}

export function DocsSpecTable(props: { table: DocsTable }) {
  return (
    <table {...stylex.attrs(styles.table)}>
      <thead>
        <tr>
          {props.table.columns.map((column) => (
            <th {...stylex.attrs(styles.cell, styles.headingCell)}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.table.rows.map((row) => (
          <tr>
            {row.map((cell) => (
              <td {...stylex.attrs(styles.cell)}>{renderTableCell(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function renderTableCell(cell: string) {
  const looksLikeCode =
    cell.startsWith("runtime.") ||
    cell.startsWith("--") ||
    cell === "id" ||
    cell === "name" ||
    cell === "version" ||
    cell === "contributions" ||
    cell === "permissions" ||
    cell === "description" ||
    cell === "widgets" ||
    cell === "layouts" ||
    cell === "searchProviders" ||
    cell === "settingsPanels"

  return looksLikeCode ? <code {...stylex.attrs(styles.inlineCode)}>{cell}</code> : cell
}
