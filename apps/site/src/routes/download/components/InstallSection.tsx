import * as stylex from "@stylexjs/stylex"

import type { DownloadPageContent } from "../downloadPrototypeContent"

const styles = stylex.create({
  section: {
    borderTop: "1px solid rgb(var(--tbr-color-line))",
    paddingBlock: 72,
    "@media (max-width: 560px)": {
      paddingBlock: 48,
    },
  },
  container: {
    marginInline: "auto",
    width: "min(calc(100% - 64px), 1180px)",
    "@media (max-width: 560px)": {
      width: "min(calc(100% - 32px), 1180px)",
    },
  },
  head: {
    alignItems: "end",
    display: "grid",
    gap: 48,
    gridTemplateColumns: "minmax(0, 0.7fr) minmax(260px, 0.3fr)",
    marginBottom: 36,
    "@media (max-width: 920px)": {
      gap: 16,
      gridTemplateColumns: "1fr",
    },
  },
  eyebrow: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    fontWeight: 650,
    margin: 0,
  },
  title: {
    fontSize: 24,
    margin: "6px 0 0",
  },
  body: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  grid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    "@media (max-width: 920px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    alignContent: "start",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    display: "grid",
    gap: 14,
    minHeight: 180,
    padding: 18,
  },
  meta: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    margin: 0,
  },
  split: {
    alignItems: "start",
    display: "grid",
    gap: 48,
    gridTemplateColumns: "minmax(0, 0.92fr) minmax(440px, 1.08fr)",
    "@media (max-width: 1180px)": {
      gridTemplateColumns: "1fr",
    },
  },
  principles: {
    display: "grid",
    gap: 12,
  },
  principle: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    padding: 18,
  },
  principleTitle: {
    display: "block",
    fontSize: 14,
    marginBottom: 6,
  },
  code: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    overflow: "hidden",
  },
  codeHead: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderBottom: "1px solid rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "flex",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 11,
    justifyContent: "space-between",
    minHeight: 42,
    paddingInline: 14,
  },
  copyButton: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    border: "1px solid rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-2)",
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    fontSize: 12,
    minHeight: 28,
    paddingInline: 9,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
  },
  codeWindow: {
    maxHeight: 440,
    overflow: "auto",
  },
  pre: {
    color: "rgb(var(--tbr-color-text))",
    fontFamily: "var(--tbr-font-mono)",
    fontSize: 12,
    lineHeight: 1.7,
    margin: 0,
    padding: 18,
    whiteSpace: "pre",
  },
})

export function InstallSection(props: {
  content: DownloadPageContent
  showToast: (message: string) => void
}) {
  return (
    <>
      <section
        {...stylex.attrs(styles.section)}
        data-od-id="install"
        data-component="SiteInstallSteps"
      >
        <div {...stylex.attrs(styles.container)}>
          <div {...stylex.attrs(styles.head)}>
            <div>
              <p {...stylex.attrs(styles.eyebrow)}>INSTALL</p>
              <h2 {...stylex.attrs(styles.title)}>{props.content.install.title}</h2>
            </div>
            <p {...stylex.attrs(styles.body)}>{props.content.install.body}</p>
          </div>

          <div {...stylex.attrs(styles.grid)}>
            {props.content.install.steps.map((step: [string, string, string]) => (
              <article {...stylex.attrs(styles.card)}>
                <span {...stylex.attrs(styles.meta)}>{step[0]}</span>
                <h3 {...stylex.attrs(styles.cardTitle)}>{step[1]}</h3>
                <p {...stylex.attrs(styles.body)}>{step[2]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        {...stylex.attrs(styles.section)}
        data-od-id="developer-install"
        data-component="DocsCodeBlock"
      >
        <div {...stylex.attrs(styles.container, styles.split)}>
          <div {...stylex.attrs(styles.principles)}>
            <p {...stylex.attrs(styles.eyebrow)}>DEVELOPER PREVIEW</p>
            <h2 {...stylex.attrs(styles.title)}>{props.content.dev.title}</h2>
            {props.content.dev.principles.map((item: [string, string]) => (
              <div {...stylex.attrs(styles.principle)}>
                <strong {...stylex.attrs(styles.principleTitle)}>{item[0]}</strong>
                <span {...stylex.attrs(styles.body)}>{item[1]}</span>
              </div>
            ))}
          </div>

          <div {...stylex.attrs(styles.code)} data-docs-code>
            <div {...stylex.attrs(styles.codeHead)}>
              <span>local preview</span>
              <button
                {...stylex.attrs(styles.copyButton)}
                type="button"
                data-copy-button
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
            <div {...stylex.attrs(styles.codeWindow)}>
              <pre {...stylex.attrs(styles.pre)}>
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
