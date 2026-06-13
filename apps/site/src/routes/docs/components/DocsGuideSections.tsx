import {
  type DocsComponentDemo,
  type DocsComponentSpec,
  type DocsPageContent,
} from "../docsPageContent"
import { getDocsExample } from "../docsExamples"
import { DocsCodeBlock, DocsSpecTable } from "./DocsCodeBlock"

export function DocsGuideSections(props: { content: DocsPageContent; locale: "zh-CN" | "en" }) {
  return (
    <main class="main">
      <section class="comp-spec" id="quickstart">
        <DocsSectionHead
          eyebrow={props.content.sections.quickstart.eyebrow}
          title={props.content.sections.quickstart.title}
          description={props.content.sections.quickstart.description}
        />
        {props.content.sections.quickstart.demos.map((demo) => (
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
          eyebrow={props.content.sections.manifest.eyebrow}
          title={props.content.sections.manifest.title}
          description={props.content.sections.manifest.description}
        />
        <div class="anatomy-box">
          <h4>{props.content.sections.manifest.anatomyTitle}</h4>
          <ul>
            {props.content.sections.manifest.anatomyItems.map((item) => (
              <li>{item}</li>
            ))}
          </ul>
        </div>
        <DocsCodeBlock block={props.content.sections.manifest.codeBlock} />
        <DocsSpecTable table={props.content.sections.manifest.table} />
      </section>

      <section class="comp-spec" id="runtime">
        <DocsSectionHead
          eyebrow={props.content.sections.runtime.eyebrow}
          title={props.content.sections.runtime.title}
          description={props.content.sections.runtime.description}
        />
        {props.content.sections.runtime.demos.map((demo) => (
          <div class="demo-section">
            <div class="demo-section-head">
              <h4>{demo.title}</h4>
            </div>
            <div class="demo-body">
              {demo.codeBlock ? <DocsCodeBlock block={demo.codeBlock} /> : null}
            </div>
          </div>
        ))}
        <DocsSpecTable table={props.content.sections.runtime.table} />
      </section>

      <section class="comp-spec" id="contributions">
        <DocsSectionHead
          eyebrow={props.content.sections.contributions.eyebrow}
          title={props.content.sections.contributions.title}
          description={props.content.sections.contributions.description}
        />
        <DocsSpecTable table={props.content.sections.contributions.table} />
        <div class="do-dont">
          <div class="do">
            <h5>{props.content.sections.contributions.doTitle}</h5>
            <p>{props.content.sections.contributions.doBody}</p>
          </div>
          <div class="dont">
            <h5>{props.content.sections.contributions.dontTitle}</h5>
            <p>{props.content.sections.contributions.dontBody}</p>
          </div>
        </div>
      </section>

      <section class="comp-spec" id="tokens">
        <DocsSectionHead
          eyebrow={props.content.sections.tokens.eyebrow}
          title={props.content.sections.tokens.title}
          description={props.content.sections.tokens.description}
        />
        <div class="demo-section">
          <div class="demo-section-head">
            <h4>{props.content.sections.tokens.previewTitle}</h4>
          </div>
          <div class="demo-body">
            <div
              style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 8px;
              "
            >
              {props.content.sections.tokens.swatches.map((swatch) => (
                <div style={swatch.style}>{swatch.name}</div>
              ))}
            </div>
          </div>
        </div>
        <DocsSpecTable table={props.content.sections.tokens.table} />
      </section>

      <ComponentSpecSections
        specs={props.content.componentSpecs.inputControls}
        locale={props.locale}
      />
      <ComponentSpecSections
        specs={props.content.componentSpecs.selectionControls}
        locale={props.locale}
      />
      <ComponentSpecSections
        specs={props.content.componentSpecs.overlayControls}
        locale={props.locale}
      />
      <ComponentSpecSections
        specs={props.content.componentSpecs.feedbackControls}
        locale={props.locale}
      />
      <ComponentSpecSections
        specs={props.content.componentSpecs.structureControls}
        locale={props.locale}
      />
    </main>
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

function ComponentSpecSections(props: { specs: DocsComponentSpec[]; locale: "zh-CN" | "en" }) {
  return (
    <>
      {props.specs.map((spec) => (
        <DocsComponentSpecSection spec={spec} locale={props.locale} />
      ))}
    </>
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
