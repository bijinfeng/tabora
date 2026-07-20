import { createMemo, Match, Switch } from "solid-js"
import * as stylex from "@stylexjs/stylex"

import {
  type DocsComponentDemo,
  type DocsComponentSpec,
  type DocsPageContent,
  type DocsResolvedComponentPage,
  defaultDocsSectionId,
  getDocsSectionPath,
  resolveDocsPage,
} from "../docsPageContent"
import { getDocsExample } from "../docsExamples"
import { DocsCodeBlock, DocsSpecTable } from "./DocsCodeBlock"

const styles = stylex.create({
  main: {
    display: "flex",
    flexDirection: "column",
    gap: 40,
    maxWidth: 1100,
    minWidth: 0,
    padding: 32,
    "@media (max-width: 900px)": {
      padding: "24px 16px 48px",
    },
  },
  section: {
    display: "grid",
    gap: 18,
    scrollMarginTop: 20,
  },
  sectionHead: {
    display: "grid",
    gap: 8,
    marginBottom: 20,
    maxWidth: 760,
  },
  eyebrow: {
    color: "rgb(var(--tbr-color-accent))",
    fontSize: 10,
    fontWeight: 700,
    margin: 0,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.25,
    margin: 0,
  },
  body: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    lineHeight: 1.62,
    margin: 0,
  },
  demo: {
    display: "grid",
    gap: 0,
    marginBottom: 18,
    minWidth: 0,
  },
  demoHead: {
    alignItems: "center",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 8,
  },
  demoTitle: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 11,
    fontWeight: 700,
    margin: 0,
    textTransform: "uppercase",
  },
  demoBody: {
    display: "grid",
    gap: 12,
    minWidth: 0,
    paddingBottom: 16,
  },
  codeBlock: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    marginBottom: 18,
    overflow: "hidden",
  },
  codeHead: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text-subtle))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    paddingBlock: 8,
    paddingInline: 14,
  },
  codeWindow: {
    overflowX: "auto",
  },
  pre: {
    color: "rgb(var(--tbr-color-text))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
    lineHeight: 1.65,
    margin: 0,
    paddingBlock: 16,
    paddingInline: 18,
    whiteSpace: "pre",
  },
  anatomy: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    padding: 14,
  },
  anatomyTitle: {
    fontSize: 13,
    margin: 0,
  },
  anatomyList: {
    display: "grid",
    gap: 7,
    margin: "10px 0 0",
    paddingLeft: 18,
  },
  anatomyItem: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    lineHeight: 1.62,
  },
  doDont: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  doDontPanel: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    display: "grid",
    gap: 8,
    padding: 14,
  },
  doDontTitle: {
    fontSize: 13,
    margin: 0,
  },
  button: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text))",
    display: "inline-flex",
    fontSize: 13,
    fontWeight: 650,
    justifyContent: "center",
    minHeight: 38,
    paddingInline: 14,
    textDecoration: "none",
    width: "fit-content",
  },
  compHeader: {
    display: "grid",
    gap: 8,
    marginBottom: 20,
  },
  compTitle: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 24,
    lineHeight: 1.2,
    margin: 0,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  metaTag: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
    fontWeight: 500,
    paddingBlock: 2,
    paddingInline: 8,
    whiteSpace: "nowrap",
  },
  swatches: {
    display: "grid",
    gap: 8,
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  },
  swatch: {
    borderColor: "transparent",
    borderRadius: "var(--tbr-radius-panel)",
    borderStyle: "solid",
    borderWidth: 1,
    fontSize: 12,
    fontWeight: 600,
    paddingBlock: 10,
    paddingInline: 12,
  },
  swatchAccent: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-inverse))",
  },
  swatchAccentSoft: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-accent))",
  },
  swatchSurface: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text))",
  },
  swatchSurfaceSoft: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text))",
  },
  swatchSurfaceHover: {
    backgroundColor: "rgb(var(--tbr-color-surface-hover))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text))",
  },
  swatchPage: {
    backgroundColor: "rgb(var(--tbr-color-page))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text))",
  },
  swatchDanger: {
    backgroundColor: "rgb(var(--tbr-color-danger))",
    color: "rgb(var(--tbr-color-inverse))",
  },
  swatchSuccess: {
    backgroundColor: "rgb(var(--tbr-color-success))",
    color: "rgb(var(--tbr-color-inverse))",
  },
})

function swatchToneStyle(tone: DocsPageContent["sections"]["tokens"]["swatches"][number]["tone"]) {
  switch (tone) {
    case "accent":
      return styles.swatchAccent
    case "accentSoft":
      return styles.swatchAccentSoft
    case "surface":
      return styles.swatchSurface
    case "surfaceSoft":
      return styles.swatchSurfaceSoft
    case "surfaceHover":
      return styles.swatchSurfaceHover
    case "page":
      return styles.swatchPage
    case "danger":
      return styles.swatchDanger
    case "success":
      return styles.swatchSuccess
  }
}

export function DocsGuideSections(props: {
  content: DocsPageContent
  locale: "zh-CN" | "en"
  sectionId?: string
}) {
  const page = createMemo(() =>
    resolveDocsPage(props.content, props.sectionId ?? defaultDocsSectionId),
  )

  return (
    <main {...stylex.attrs(styles.main)}>
      <Switch fallback={<MissingDocsSection id={page().id} locale={props.locale} />}>
        <Match when={page().kind === "guide" && page().id === "quickstart"}>
          <QuickstartSection section={props.content.sections.quickstart} />
        </Match>
        <Match when={page().kind === "guide" && page().id === "manifest"}>
          <ManifestSection section={props.content.sections.manifest} />
        </Match>
        <Match when={page().kind === "guide" && page().id === "runtime"}>
          <RuntimeSection section={props.content.sections.runtime} />
        </Match>
        <Match when={page().kind === "guide" && page().id === "contributions"}>
          <ContributionsSection section={props.content.sections.contributions} />
        </Match>
        <Match when={page().kind === "guide" && page().id === "tokens"}>
          <TokensSection section={props.content.sections.tokens} />
        </Match>
        <Match
          when={page().kind === "component" ? (page() as DocsResolvedComponentPage) : undefined}
        >
          {(resolved) => <DocsComponentSpecSection spec={resolved().spec} locale={props.locale} />}
        </Match>
      </Switch>
    </main>
  )
}

function QuickstartSection(props: { section: DocsPageContent["sections"]["quickstart"] }) {
  return (
    <section {...stylex.attrs(styles.section)} id="quickstart">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      {props.section.demos.map((demo) => (
        <div {...stylex.attrs(styles.demo)} data-docs-demo>
          <div {...stylex.attrs(styles.demoHead)}>
            <h4 {...stylex.attrs(styles.demoTitle)}>{demo.title}</h4>
          </div>
          <div {...stylex.attrs(styles.demoBody)}>
            {demo.codeBlock ? <DocsCodeBlock block={demo.codeBlock} /> : null}
            {demo.treeBlock ? (
              <div {...stylex.attrs(styles.codeBlock)} data-docs-code>
                <div {...stylex.attrs(styles.codeHead)}>
                  <span>{demo.treeBlock.label}</span>
                </div>
                <div {...stylex.attrs(styles.codeWindow)}>
                  <pre {...stylex.attrs(styles.pre)}>
                    <code>{demo.treeBlock.code}</code>
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  )
}

function ManifestSection(props: { section: DocsPageContent["sections"]["manifest"] }) {
  return (
    <section {...stylex.attrs(styles.section)} id="manifest">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      <div {...stylex.attrs(styles.anatomy)}>
        <h4 {...stylex.attrs(styles.anatomyTitle)}>{props.section.anatomyTitle}</h4>
        <ul {...stylex.attrs(styles.anatomyList)}>
          {props.section.anatomyItems.map((item) => (
            <li {...stylex.attrs(styles.anatomyItem)}>{item}</li>
          ))}
        </ul>
      </div>
      <DocsCodeBlock block={props.section.codeBlock} />
      <DocsSpecTable table={props.section.table} />
    </section>
  )
}

function RuntimeSection(props: { section: DocsPageContent["sections"]["runtime"] }) {
  return (
    <section {...stylex.attrs(styles.section)} id="runtime">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      {props.section.demos.map((demo) => (
        <div {...stylex.attrs(styles.demo)} data-docs-demo>
          <div {...stylex.attrs(styles.demoHead)}>
            <h4 {...stylex.attrs(styles.demoTitle)}>{demo.title}</h4>
          </div>
          <div {...stylex.attrs(styles.demoBody)}>
            {demo.codeBlock ? <DocsCodeBlock block={demo.codeBlock} /> : null}
          </div>
        </div>
      ))}
      <DocsSpecTable table={props.section.table} />
    </section>
  )
}

function ContributionsSection(props: { section: DocsPageContent["sections"]["contributions"] }) {
  return (
    <section {...stylex.attrs(styles.section)} id="contributions">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      <DocsSpecTable table={props.section.table} />
      <div {...stylex.attrs(styles.doDont)}>
        <div {...stylex.attrs(styles.doDontPanel)}>
          <h5 {...stylex.attrs(styles.doDontTitle)}>{props.section.doTitle}</h5>
          <p {...stylex.attrs(styles.body)}>{props.section.doBody}</p>
        </div>
        <div {...stylex.attrs(styles.doDontPanel)}>
          <h5 {...stylex.attrs(styles.doDontTitle)}>{props.section.dontTitle}</h5>
          <p {...stylex.attrs(styles.body)}>{props.section.dontBody}</p>
        </div>
      </div>
    </section>
  )
}

function TokensSection(props: { section: DocsPageContent["sections"]["tokens"] }) {
  return (
    <section {...stylex.attrs(styles.section)} id="tokens">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      <div {...stylex.attrs(styles.demo)} data-docs-demo>
        <div {...stylex.attrs(styles.demoHead)}>
          <h4 {...stylex.attrs(styles.demoTitle)}>{props.section.previewTitle}</h4>
        </div>
        <div {...stylex.attrs(styles.demoBody)}>
          <div {...stylex.attrs(styles.swatches)}>
            {props.section.swatches.map((swatch) => (
              <div {...stylex.attrs(styles.swatch, swatchToneStyle(swatch.tone))}>
                {swatch.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <DocsSpecTable table={props.section.table} />
    </section>
  )
}

function MissingDocsSection(props: { id: string; locale: "zh-CN" | "en" }) {
  const isEnglish = props.locale === "en"

  return (
    <section {...stylex.attrs(styles.section)}>
      <DocsSectionHead
        eyebrow={isEnglish ? "NOT FOUND" : "未找到"}
        title={isEnglish ? "This docs page does not exist" : "没有找到这个文档页面"}
        description={
          isEnglish
            ? "Choose a page from the left navigation to continue."
            : "请从左侧导航选择一个文档页面继续。"
        }
      />
      <a {...stylex.attrs(styles.button)} href={getDocsSectionPath(defaultDocsSectionId)}>
        {isEnglish ? "Back to quick start" : "返回快速开始"}
      </a>
    </section>
  )
}

function DocsSectionHead(props: { eyebrow: string; title: string; description: string }) {
  return (
    <div {...stylex.attrs(styles.sectionHead)}>
      <p {...stylex.attrs(styles.eyebrow)}>{props.eyebrow}</p>
      <h2 {...stylex.attrs(styles.sectionTitle)}>{props.title}</h2>
      <p {...stylex.attrs(styles.body)}>{props.description}</p>
    </div>
  )
}

function DocsComponentSpecSection(props: { spec: DocsComponentSpec; locale: "zh-CN" | "en" }) {
  return (
    <section {...stylex.attrs(styles.section)} id={props.spec.id}>
      <div {...stylex.attrs(styles.compHeader)}>
        <h3 {...stylex.attrs(styles.compTitle)}>{props.spec.title}</h3>
        <p {...stylex.attrs(styles.body)}>{props.spec.description}</p>
        <div {...stylex.attrs(styles.meta)}>
          {props.spec.metaTags.map((tag) => (
            <span {...stylex.attrs(styles.metaTag)}>{tag}</span>
          ))}
        </div>
      </div>
      {props.spec.anatomyTitle ? (
        <div {...stylex.attrs(styles.anatomy)}>
          <h4 {...stylex.attrs(styles.anatomyTitle)}>{props.spec.anatomyTitle}</h4>
          <ul {...stylex.attrs(styles.anatomyList)}>
            {props.spec.anatomyItems?.map((item) => (
              <li {...stylex.attrs(styles.anatomyItem)}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {props.spec.demos.map((demo) => (
        <div {...stylex.attrs(styles.demo)} data-docs-demo>
          <div {...stylex.attrs(styles.demoHead)}>
            <h4 {...stylex.attrs(styles.demoTitle)}>{demo.title}</h4>
          </div>
          <DocsComponentDemoView demo={demo} locale={props.locale} />
        </div>
      ))}
      <DocsSpecTable table={props.spec.table} />
      <div {...stylex.attrs(styles.doDont)}>
        <div {...stylex.attrs(styles.doDontPanel)}>
          <h5 {...stylex.attrs(styles.doDontTitle)}>{props.spec.doTitle}</h5>
          <p {...stylex.attrs(styles.body)}>{props.spec.doBody}</p>
        </div>
        <div {...stylex.attrs(styles.doDontPanel)}>
          <h5 {...stylex.attrs(styles.doDontTitle)}>{props.spec.dontTitle}</h5>
          <p {...stylex.attrs(styles.body)}>{props.spec.dontBody}</p>
        </div>
      </div>
      {props.spec.pluginExample ? <DocsCodeBlock block={props.spec.pluginExample} /> : null}
    </section>
  )
}

function DocsComponentDemoView(props: { demo: DocsComponentDemo; locale: "zh-CN" | "en" }) {
  if ("exampleId" in props.demo) {
    const example = getDocsExample(props.demo.exampleId)
    if (!example) return null

    return (
      <>
        <div {...stylex.attrs(styles.demoBody)} data-docs-demo>
          {example.render()}
        </div>
        <DocsCodeBlock
          block={{
            label: example.language.toUpperCase(),
            copyLabel: props.locale === "en" ? "Copy" : "复制",
            copiedLabel: props.locale === "en" ? "Copied" : "已复制",
            code: example.source,
          }}
        />
      </>
    )
  }

  return (
    <>
      <div {...stylex.attrs(styles.demoBody)} data-docs-demo>
        <div innerHTML={props.demo.previewHtml} />
      </div>
      <DocsCodeBlock block={props.demo.codeBlock} />
    </>
  )
}
