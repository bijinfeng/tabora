import { createMemo, onCleanup, onMount } from "solid-js"

import { useSiteI18n } from "../../app/AppShell"
import { PrototypeTopnav } from "../../shared/PrototypeTopnav"
import { getDocsPageContent, type DocsCodeBlock, type DocsTable } from "./docsPageContent"

import docsPrototypeHtml from "../../../../../docs/design/docs.html?raw"

const docsPrototypeCss = docsPrototypeHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ""

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const guessLanguage = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json"
  if (trimmed.includes("<") && trimmed.includes(">")) return "html"
  if (/(^|\n)\s*(pnpm|npm|yarn|bun)\s+/.test(value) || /(^|\n)\s*#/.test(value)) return "bash"
  return "plain"
}

const highlightJson = (value: string) => {
  const escaped = escapeHtml(value)
  const withStrings = escaped.replace(
    /&quot;([^&]|&(?!quot;))*?&quot;/g,
    (match, _content, offset, full) => {
      const after = full.slice(offset + match.length)
      const isKey = /^\s*:/.test(after)
      const cls = isKey ? "tbr-syn-attr" : "tbr-syn-string"
      return `<span class="${cls}">${match}</span>`
    },
  )

  return withStrings
    .replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
      return `<span class="tbr-syn-number">${match}</span>`
    })
    .replace(/\b(true|false|null)\b/g, (match) => {
      return `<span class="tbr-syn-keyword">${match}</span>`
    })
    .replace(/[{}[\],:]/g, (match) => {
      return `<span class="tbr-syn-punct">${match}</span>`
    })
}

const highlightBash = (value: string) => {
  const escaped = escapeHtml(value)
  const withComments = escaped.replace(/(^|\n)\s*#.*$/g, (match) => {
    return `<span class="tbr-syn-comment">${match}</span>`
  })

  const withStrings = withComments.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => {
    return `<span class="tbr-syn-string">${match}</span>`
  })

  return withStrings.replace(/(^|\s)(--?[\w-]+)/g, (match, space, flag) => {
    return `${space}<span class="tbr-syn-keyword">${flag}</span>`
  })
}

const highlightHtmlCode = (value: string) => {
  const escaped = escapeHtml(value)
  const withComments = escaped.replace(/&lt;!--[\s\S]*?--&gt;/g, (match) => {
    return `<span class="tbr-syn-comment">${match}</span>`
  })

  return withComments.replace(/&lt;\/?[\w:-]+[\s\S]*?&gt;/g, (match) => {
    const inner = match.slice(4, -4)
    const isClose = inner.startsWith("/")
    const withoutSlash = isClose ? inner.slice(1) : inner
    const tagName = withoutSlash.match(/^[^\s]+/)?.[0] ?? withoutSlash
    const rest = withoutSlash.slice(tagName.length)
    const tagHead = `${isClose ? "/" : ""}${tagName}`

    const highlightedRest = rest
      .replace(/\s([\w:-]+)(?==)/g, (_m, name: string) => {
        return ` <span class="tbr-syn-attr">${name}</span>`
      })
      .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (valueMatch) => {
        return `<span class="tbr-syn-string">${valueMatch}</span>`
      })

    return `<span class="tbr-syn-punct">&lt;</span><span class="tbr-syn-tag">${tagHead}</span>${highlightedRest}<span class="tbr-syn-punct">&gt;</span>`
  })
}

const highlightCode = (value: string) => {
  const lang = guessLanguage(value)
  if (lang === "json") return highlightJson(value)
  if (lang === "html") return highlightHtmlCode(value)
  if (lang === "bash") return highlightBash(value)
  const escaped = escapeHtml(value)
  return escaped
    .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => {
      return `<span class="tbr-syn-string">${match}</span>`
    })
    .replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
      return `<span class="tbr-syn-number">${match}</span>`
    })
}

const getDocsPrototypeTailHtml = () => {
  const body = docsPrototypeHtml.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? ""
  const withoutScripts = body.replace(/<script[\s\S]*?<\/script>/g, "")
  const tail =
    withoutScripts.match(/<section class="comp-spec" id="button"[\s\S]*?(?=<\/main>)/)?.[0] ?? ""

  return tail.replace(/href="component-spec\.html(#.*?)?"/g, (_, hash: string | undefined) => {
    return `href="/docs/components${hash ?? ""}"`
  })
}

export function DocsHomePage() {
  const i18n = useSiteI18n()
  const content = createMemo(() => getDocsPageContent(i18n.locale()))
  const tailHtml = createMemo(() => getDocsPrototypeTailHtml())

  onMount(() => {
    const styleTag = document.createElement("style")
    styleTag.dataset.docsPrototype = "true"
    styleTag.textContent = docsPrototypeCss
    document.head.append(styleTag)

    let resetCopyTimer = 0

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const copyButton = target.closest<HTMLButtonElement>(".copy-btn")
      if (!copyButton) return

      const block =
        copyButton.closest(".code-block") ?? copyButton.closest(".code-head")?.parentElement
      const code = block?.querySelector("code")?.textContent
      if (!code) return

      try {
        await navigator.clipboard?.writeText(code)
        window.clearTimeout(resetCopyTimer)
        copyButton.textContent =
          copyButton.dataset.copySuccess ?? (i18n.locale() === "en" ? "Copied" : "已复制")
        resetCopyTimer = window.setTimeout(() => {
          copyButton.textContent =
            copyButton.dataset.copyDefault ?? (i18n.locale() === "en" ? "Copy" : "复制")
        }, 1500)
      } catch {}
    }

    document.addEventListener("click", onClick)

    queueMicrotask(() => {
      document.querySelectorAll("pre > code").forEach((element) => {
        if (!(element instanceof HTMLElement)) return
        if (element.dataset.syntax === "true") return
        element.dataset.syntax = "true"
        element.innerHTML = highlightCode(element.textContent ?? "")
      })
    })

    onCleanup(() => {
      document.removeEventListener("click", onClick)
      window.clearTimeout(resetCopyTimer)
      styleTag.remove()
    })
  })

  return (
    <>
      <PrototypeTopnav active="docs" onThemeToggled={() => {}} />
      <div class="page-body">
        <aside class="sidebar" aria-label={content().sidebarTitle}>
          <div class="sidebar-title">
            Tabora <span>Docs</span>
          </div>
          {content().sidebarGroups.map((group) => (
            <>
              <div class="sidebar-section">{group.title}</div>
              {group.items.map((item) => (
                <a class="sidebar-link" href={`#${item.id}`}>
                  {item.label}
                </a>
              ))}
            </>
          ))}
        </aside>

        <main class="main">
          <section class="comp-spec" id="quickstart">
            <DocsSectionHead
              eyebrow={content().sections.quickstart.eyebrow}
              title={content().sections.quickstart.title}
              description={content().sections.quickstart.description}
            />
            {content().sections.quickstart.demos.map((demo) => (
              <div class="demo-section">
                <div class="demo-section-head">
                  <h4>{demo.title}</h4>
                </div>
                <div class="demo-body">
                  {demo.codeBlock ? <DocsCodeBlock block={demo.codeBlock} /> : null}
                  {demo.treeBlock ? (
                    <div class="code-block">
                      <div class="code-head">
                        <span>{demo.treeBlock.label}</span>
                      </div>
                      <div class="code-window">
                        <pre>
                          <code>{demo.treeBlock.code}</code>
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </section>

          <section class="comp-spec" id="manifest">
            <DocsSectionHead
              eyebrow={content().sections.manifest.eyebrow}
              title={content().sections.manifest.title}
              description={content().sections.manifest.description}
            />
            <div class="anatomy-box">
              <h4>{content().sections.manifest.anatomyTitle}</h4>
              <ul>
                {content().sections.manifest.anatomyItems.map((item) => (
                  <li>{item}</li>
                ))}
              </ul>
            </div>
            <DocsCodeBlock block={content().sections.manifest.codeBlock} />
            <DocsSpecTable table={content().sections.manifest.table} />
          </section>

          <section class="comp-spec" id="runtime">
            <DocsSectionHead
              eyebrow={content().sections.runtime.eyebrow}
              title={content().sections.runtime.title}
              description={content().sections.runtime.description}
            />
            {content().sections.runtime.demos.map((demo) => (
              <div class="demo-section">
                <div class="demo-section-head">
                  <h4>{demo.title}</h4>
                </div>
                <div class="demo-body">
                  {demo.codeBlock ? <DocsCodeBlock block={demo.codeBlock} /> : null}
                </div>
              </div>
            ))}
            <DocsSpecTable table={content().sections.runtime.table} />
          </section>

          <section class="comp-spec" id="contributions">
            <DocsSectionHead
              eyebrow={content().sections.contributions.eyebrow}
              title={content().sections.contributions.title}
              description={content().sections.contributions.description}
            />
            <DocsSpecTable table={content().sections.contributions.table} />
            <div class="do-dont">
              <div class="do">
                <h5>{content().sections.contributions.doTitle}</h5>
                <p>{content().sections.contributions.doBody}</p>
              </div>
              <div class="dont">
                <h5>{content().sections.contributions.dontTitle}</h5>
                <p>{content().sections.contributions.dontBody}</p>
              </div>
            </div>
          </section>

          <section class="comp-spec" id="tokens">
            <DocsSectionHead
              eyebrow={content().sections.tokens.eyebrow}
              title={content().sections.tokens.title}
              description={content().sections.tokens.description}
            />
            <div class="demo-section">
              <div class="demo-section-head">
                <h4>{content().sections.tokens.previewTitle}</h4>
              </div>
              <div class="demo-body">
                <div
                  style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 8px;
                  "
                >
                  {content().sections.tokens.swatches.map((swatch) => (
                    <div style={swatch.style}>{swatch.name}</div>
                  ))}
                </div>
              </div>
            </div>
            <DocsSpecTable table={content().sections.tokens.table} />
          </section>

          <div innerHTML={tailHtml()} />
        </main>
      </div>
    </>
  )
}

function DocsSectionHead(props: { eyebrow: string; title: string; description: string }) {
  return (
    <div class="section-head">
      <p class="eyebrow">{props.eyebrow}</p>
      <h2>{props.title}</h2>
      <p>{props.description}</p>
    </div>
  )
}

function DocsCodeBlock(props: { block: DocsCodeBlock }) {
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

function DocsSpecTable(props: { table: DocsTable }) {
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
