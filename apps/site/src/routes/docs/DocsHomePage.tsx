import { A, useParams } from "@solidjs/router"
import { createEffect, createMemo, onCleanup, onMount } from "solid-js"

import { useSiteI18n } from "../../app/AppShell"
import { PrototypeTopnav } from "../../shared/PrototypeTopnav"
import { highlightCode } from "../../shared/codeHighlight"
import { DocsGuideSections } from "./components/DocsGuideSections"
import { defaultDocsSectionId, getDocsPageContent, getDocsSectionPath } from "./docsPageContent"
import docsPrototypeHtml from "../../../../../docs/design/docs.html?raw"

const docsPrototypeCss = docsPrototypeHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ""

const highlightVisibleCode = () => {
  document.querySelectorAll("pre > code").forEach((element) => {
    if (!(element instanceof HTMLElement)) return
    if (element.dataset.syntax === "true") return
    element.dataset.syntax = "true"
    element.innerHTML = highlightCode(element.textContent ?? "")
  })
}

export function DocsHomePage() {
  const i18n = useSiteI18n()
  const params = useParams<{ sectionId?: string }>()
  const content = createMemo(() => getDocsPageContent(i18n.locale()))
  const currentSectionId = createMemo(() => params.sectionId ?? defaultDocsSectionId)

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

    onCleanup(() => {
      document.removeEventListener("click", onClick)
      window.clearTimeout(resetCopyTimer)
      styleTag.remove()
    })
  })

  createEffect(() => {
    currentSectionId()
    queueMicrotask(highlightVisibleCode)
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
                <A
                  class="sidebar-link"
                  classList={{ active: currentSectionId() === item.id }}
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
