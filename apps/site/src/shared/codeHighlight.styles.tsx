import type { JSX } from "solid-js"

export const codeHighlightCssText = `
[data-docs-code] pre > code .th-token,
pre > code[data-syntax] .th-token {
  color: inherit;
}

[data-docs-code] pre > code .th-keyword,
pre > code[data-syntax] .th-keyword {
  color: rgb(var(--tbr-color-info));
}

[data-docs-code] pre > code .th-string,
pre > code[data-syntax] .th-string {
  color: rgb(var(--tbr-color-success));
}

[data-docs-code] pre > code .th-number,
pre > code[data-syntax] .th-number {
  color: rgb(var(--tbr-color-warning));
}

[data-docs-code] pre > code .th-literal,
pre > code[data-syntax] .th-literal {
  color: rgb(var(--tbr-color-info));
}

[data-docs-code] pre > code .th-comment,
pre > code[data-syntax] .th-comment {
  color: rgb(var(--tbr-color-text-subtle));
  font-style: italic;
}

[data-docs-code] pre > code .th-tag,
pre > code[data-syntax] .th-tag {
  color: rgb(var(--tbr-color-accent));
}

[data-docs-code] pre > code .th-attr,
[data-docs-code] pre > code .th-property,
pre > code[data-syntax] .th-attr,
pre > code[data-syntax] .th-property {
  color: rgb(var(--tbr-color-text-muted));
}

[data-docs-code] pre > code .th-type,
pre > code[data-syntax] .th-type {
  color: rgb(var(--tbr-color-info));
}

[data-docs-code] pre > code .th-function,
pre > code[data-syntax] .th-function {
  color: rgb(var(--tbr-color-accent));
}

[data-docs-code] pre > code .th-command,
pre > code[data-syntax] .th-command {
  color: rgb(var(--tbr-color-info));
  font-weight: 600;
}
`

export function CodeHighlightStyle(): JSX.Element {
  return <style>{codeHighlightCssText}</style>
}
