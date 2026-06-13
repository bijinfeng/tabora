import type { DownloadPageContent } from "../downloadPrototypeContent"

export function InstallSection(props: {
  content: DownloadPageContent
  showToast: (message: string) => void
}) {
  return (
    <>
      <section class="site-section" data-od-id="install" data-component="SiteInstallSteps">
        <div class="site-container">
          <div class="site-section-head">
            <div>
              <p class="site-eyebrow">INSTALL</p>
              <h2>{props.content.install.title}</h2>
            </div>
            <p>{props.content.install.body}</p>
          </div>

          <div class="install-grid">
            {props.content.install.steps.map((step: [string, string, string]) => (
              <article class="install-card">
                <span class="meta">{step[0]}</span>
                <h3>{step[1]}</h3>
                <p>{step[2]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section class="site-section" data-od-id="developer-install" data-component="DocsCodeBlock">
        <div class="site-container site-split">
          <div class="site-principles">
            <p class="site-eyebrow">DEVELOPER PREVIEW</p>
            <h2>{props.content.dev.title}</h2>
            {props.content.dev.principles.map((item: [string, string]) => (
              <div class="site-principle">
                <strong>{item[0]}</strong>
                <span>{item[1]}</span>
              </div>
            ))}
          </div>

          <div class="docs-code">
            <div class="code-head">
              <span>local preview</span>
              <button
                class="copy-btn"
                type="button"
                data-copy-target="#download-install-code"
                onClick={async () => {
                  const code = document
                    .querySelector<HTMLElement>("#download-install-code")
                    ?.textContent?.trim()
                  if (!code) return
                  try {
                    await navigator.clipboard?.writeText(code)
                    props.showToast(props.content.dev.copied)
                  } catch {
                    props.showToast(props.content.dev.copyFailed)
                  }
                }}
              >
                {props.content.dev.copyLabel}
              </button>
            </div>
            <div class="code-window">
              <pre>
                <code id="download-install-code">{`pnpm install
pnpm dev

# 打开浏览器扩展开发者模式
# 加载 dist/extension 作为未打包扩展
# 新建标签页后进入 Tabora 工作台`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
