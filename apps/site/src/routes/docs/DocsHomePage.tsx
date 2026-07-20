import { A, useParams } from "@solidjs/router"
import * as stylex from "@stylexjs/stylex"
import { createEffect, createMemo, onCleanup, onMount } from "solid-js"
import { useSiteI18n } from "../../app/AppShell"
import { highlightCode } from "../../shared/codeHighlight"
import { sx } from "../../shared/stylex"
import { DocsTopnav } from "./components/DocsTopnav"
import { DocsGuideSections } from "./components/DocsGuideSections"
import { defaultDocsSectionId, getDocsPageContent, getDocsSectionPath } from "./docsPageContent"
const highlightVisibleCode = () => {
  document.querySelectorAll("pre > code").forEach((element) => {
    if (!(element instanceof HTMLElement)) return
    if (element.dataset.syntax === "true") return
    element.dataset.syntax = "true"
    element.innerHTML = highlightCode(element.textContent ?? "")
  })
}
const styles = stylex.create({
  page: {
    alignItems: "stretch",
    display: "grid",
    gridTemplateColumns: "250px minmax(0, 1fr)",
    minHeight: "calc(100vh - 56px)",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  sidebar: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderRight: "1px solid rgb(var(--tbr-color-line))",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    height: "calc(100vh - 56px)",
    overflowY: "auto",
    paddingBlock: 24,
    paddingInline: 20,
    position: "sticky",
    top: 56,
    "@media (max-width: 900px)": {
      borderBottom: "1px solid rgb(var(--tbr-color-line))",
      borderRightWidth: 0,
      height: "auto",
      position: "static",
    },
  },
  title: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
  },
  titleAccent: {
    color: "rgb(var(--tbr-color-accent))",
  },
  section: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
    fontWeight: 700,
    paddingBlock: "14px 4px",
    textTransform: "uppercase",
  },
  link: {
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    paddingBlock: 6,
    paddingInline: 12,
    textDecoration: "none",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
  },
  linkActive: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
    fontWeight: 650,
  },
})
export function DocsHomePage() {
  const i18n = useSiteI18n()
  const params = useParams<{ sectionId?: string }>()
  const content = createMemo(() => getDocsPageContent(i18n.locale()))
  const currentSectionId = createMemo(() => params.sectionId ?? defaultDocsSectionId)
  onMount(() => {
    let resetCopyTimer = 0
    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const copyButton = target.closest<HTMLButtonElement>("[data-copy-button]")
      if (!copyButton) return
      const block = copyButton.closest("[data-docs-code]")
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

    onCleanup(() => {
      document.removeEventListener("click", onClick)
      window.clearTimeout(resetCopyTimer)
    })
  })

  createEffect(() => {
    currentSectionId()
    queueMicrotask(highlightVisibleCode)
  })

  return (
    <>
      <DocsTopnav />
      <div {...sx(styles.page)}>
        <aside {...sx(styles.sidebar)} aria-label={content().sidebarTitle} data-docs-sidebar>
          <div {...sx(styles.title)}>
            Tabora <span {...sx(styles.titleAccent)}>Docs</span>
          </div>
          {content().sidebarGroups.map((group) => (
            <>
              <div {...sx(styles.section)}>{group.title}</div>
              {group.items.map((item) => (
                <A
                  {...sx(styles.link, currentSectionId() === item.id && styles.linkActive)}
                  href={getDocsSectionPath(item.id)}
                >
                  {item.label}
                </A>
              ))}
            </>
          ))}
        </aside>

        <DocsGuideSections
          content={content()}
          locale={i18n.locale()}
          sectionId={currentSectionId()}
        />
      </div>
    </>
  )
}
