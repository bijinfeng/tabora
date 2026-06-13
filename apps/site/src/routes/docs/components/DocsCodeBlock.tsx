import type { DocsCodeBlock as DocsCodeBlockContent, DocsTable } from "../docsPageContent"

export function DocsCodeBlock(props: { block: DocsCodeBlockContent }) {
  return (
    <div class="code-block">
      <div class="code-head">
        <span>{props.block.label}</span>
        <button
          class="copy-btn"
          type="button"
          data-copy={props.block.copyId}
          data-copy-default={props.block.copyLabel}
          data-copy-success={props.block.copiedLabel}
        >
          {props.block.copyLabel}
        </button>
      </div>
      <div class="code-window">
        <pre>
          <code id={props.block.copyId}>{props.block.code}</code>
        </pre>
      </div>
    </div>
  )
}

export function DocsSpecTable(props: { table: DocsTable }) {
  return (
    <table class="spec-table">
      <thead>
        <tr>
          {props.table.columns.map((column) => (
            <th>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.table.rows.map((row) => (
          <tr>
            {row.map((cell) => (
              <td>{renderTableCell(cell)}</td>
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

  return looksLikeCode ? <code>{cell}</code> : cell
}
