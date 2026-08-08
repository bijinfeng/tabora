import { createMemo, createSignal, onCleanup, onMount } from "solid-js"

import { useSiteI18n } from "../../app/AppShell"
import { PrototypeTopnav } from "../../shared/PrototypeTopnav"
import { SiteFooter } from "../../shared/SiteFooter"
import { SiteToast } from "../../shared/SiteToast"
import { createSiteToastState } from "../../shared/siteToastState"
import { highlightCode } from "../../shared/codeHighlight"
import { DownloadHero } from "./components/DownloadHero"
import { DownloadSupport } from "./components/DownloadSupport"
import { InstallSection } from "./components/InstallSection"
import { PlatformSection } from "./components/PlatformSection"
import { downloadPrototypeContent } from "./downloadPrototypeContent"

export function DownloadPage() {
  const i18n = useSiteI18n()
  const content = createMemo(() => downloadPrototypeContent[i18n.locale()])
  const toast = createSiteToastState()
  const showToast = toast.showToast
  const [openFaq, setOpenFaq] = createSignal<ReadonlySet<number>>(new Set())

  const toggleFaq = (index: number) => {
    setOpenFaq((value) => {
      const next = new Set(value)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  onMount(() => {
    const timer = window.setTimeout(() => {
      document.querySelectorAll("pre > code").forEach((element) => {
        if (!(element instanceof HTMLElement)) return
        if (element.dataset.syntax === "true") return
        element.dataset.syntax = "true"
        element.innerHTML = highlightCode(element.textContent ?? "")
      })
    }, 0)

    onCleanup(() => {
      window.clearTimeout(timer)
    })
  })

  return (
    <>
      <PrototypeTopnav
        active="download"
        actions={[
          { href: "/docs/quickstart", label: i18n.t("action.installDocs"), variant: "secondary" },
        ]}
        onThemeToggled={showToast}
      />

      <main data-site-download>
        <DownloadHero content={content()} />
        <PlatformSection content={content()} />
        <InstallSection content={content()} showToast={showToast} />
        <DownloadSupport content={content()} openFaq={openFaq()} toggleFaq={toggleFaq} />
      </main>

      <SiteFooter i18n={i18n} />
      <SiteToast visible={toast.visible()} message={toast.message()} />
    </>
  )
}
