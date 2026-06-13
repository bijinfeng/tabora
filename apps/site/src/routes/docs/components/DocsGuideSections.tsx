import { createMemo, Match, Switch } from "solid-js"

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

export function DocsGuideSections(props: {
  content: DocsPageContent
  locale: "zh-CN" | "en"
  sectionId?: string
}) {
  const page = createMemo(() =>
    resolveDocsPage(props.content, props.sectionId ?? defaultDocsSectionId),
  )

  return (
    <main class="main">
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
    <section class="comp-spec" id="quickstart">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      {props.section.demos.map((demo) => (
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
  )
}

function ManifestSection(props: { section: DocsPageContent["sections"]["manifest"] }) {
  return (
    <section class="comp-spec" id="manifest">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      <div class="anatomy-box">
        <h4>{props.section.anatomyTitle}</h4>
        <ul>
          {props.section.anatomyItems.map((item) => (
            <li>{item}</li>
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
    <section class="comp-spec" id="runtime">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      {props.section.demos.map((demo) => (
        <div class="demo-section">
          <div class="demo-section-head">
            <h4>{demo.title}</h4>
          </div>
          <div class="demo-body">
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
    <section class="comp-spec" id="contributions">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      <DocsSpecTable table={props.section.table} />
      <div class="do-dont">
        <div class="do">
          <h5>{props.section.doTitle}</h5>
          <p>{props.section.doBody}</p>
        </div>
        <div class="dont">
          <h5>{props.section.dontTitle}</h5>
          <p>{props.section.dontBody}</p>
        </div>
      </div>
    </section>
  )
}

function TokensSection(props: { section: DocsPageContent["sections"]["tokens"] }) {
  return (
    <section class="comp-spec" id="tokens">
      <DocsSectionHead
        eyebrow={props.section.eyebrow}
        title={props.section.title}
        description={props.section.description}
      />
      <div class="demo-section">
        <div class="demo-section-head">
          <h4>{props.section.previewTitle}</h4>
        </div>
        <div class="demo-body">
          <div
            style="
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
              gap: 8px;
            "
          >
            {props.section.swatches.map((swatch) => (
              <div style={swatch.style}>{swatch.name}</div>
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
    <section class="comp-spec">
      <DocsSectionHead
        eyebrow={isEnglish ? "NOT FOUND" : "未找到"}
        title={isEnglish ? "This docs page does not exist" : "没有找到这个文档页面"}
        description={
          isEnglish
            ? "Choose a page from the left navigation to continue."
            : "请从左侧导航选择一个文档页面继续。"
        }
      />
      <a class="btn btn-secondary" href={getDocsSectionPath(defaultDocsSectionId)}>
        {isEnglish ? "Back to quick start" : "返回快速开始"}
      </a>
    </section>
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

function DocsComponentSpecSection(props: { spec: DocsComponentSpec; locale: "zh-CN" | "en" }) {
  return (
    <section class="comp-spec" id={props.spec.id}>
      <div class="comp-header">
        <h3>{props.spec.title}</h3>
        <p>{props.spec.description}</p>
        <div class="comp-meta">
          {props.spec.metaTags.map((tag) => (
            <span class="comp-meta-tag">{tag}</span>
          ))}
        </div>
      </div>
      {props.spec.anatomyTitle ? (
        <div class="anatomy-box">
          <h4>{props.spec.anatomyTitle}</h4>
          <ul>
            {props.spec.anatomyItems?.map((item) => (
              <li>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {props.spec.demos.map((demo) => (
        <div class="demo-section">
          <div class="demo-section-head">
            <h4>{demo.title}</h4>
          </div>
          <DocsComponentDemoView demo={demo} locale={props.locale} />
        </div>
      ))}
      <DocsSpecTable table={props.spec.table} />
      <div class="do-dont">
        <div class="do">
          <h5>{props.spec.doTitle}</h5>
          <p>{props.spec.doBody}</p>
        </div>
        <div class="dont">
          <h5>{props.spec.dontTitle}</h5>
          <p>{props.spec.dontBody}</p>
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
        <div class="demo-body">{example.render()}</div>
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
      <div class="demo-body">
        <div innerHTML={props.demo.previewHtml} />
      </div>
      <DocsCodeBlock block={props.demo.codeBlock} />
    </>
  )
}
