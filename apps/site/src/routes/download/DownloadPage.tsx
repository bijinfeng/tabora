import { createMemo, createSignal, onCleanup, onMount } from "solid-js"

import { useSiteI18n } from "../../app/AppShell"
import { PrototypeTopnav } from "../../shared/PrototypeTopnav"
import { SiteFooter } from "../../shared/SiteFooter"
import { SiteToast } from "../../shared/SiteToast"
import { highlightCode } from "../../shared/codeHighlight"
import { DownloadHero } from "./components/DownloadHero"
import { DownloadSupport } from "./components/DownloadSupport"
import { InstallSection } from "./components/InstallSection"
import { PlatformSection } from "./components/PlatformSection"
import { downloadPrototypeContent } from "./downloadPrototypeContent"

export function DownloadPage() {
  const i18n = useSiteI18n()
  const content = createMemo(() => downloadPrototypeContent[i18n.locale()])
  const [toastMessage, setToastMessage] = createSignal("")
  const [toastVisible, setToastVisible] = createSignal(false)
  let toastTimer = 0
  const [openFaq, setOpenFaq] = createSignal<ReadonlySet<number>>(new Set())

  const showToast = (message: string) => {
    window.clearTimeout(toastTimer)
    setToastMessage(message)
    setToastVisible(true)
    toastTimer = window.setTimeout(() => setToastVisible(false), 2600)
  }

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
      window.clearTimeout(toastTimer)
    })
  })

  return (
    <>
      <PrototypeTopnav
        active="download"
        actions={[
          { href: "/docs/quickstart", label: i18n.t("action.installDocs"), variant: "secondary" },
          { href: "#platforms", label: i18n.t("action.choosePlatform"), variant: "secondary" },
        ]}
        onThemeToggled={showToast}
      />

      <main>
        <DownloadHero content={content()} />
        <PlatformSection content={content()} />
        <InstallSection content={content()} showToast={showToast} />
        <DownloadSupport content={content()} openFaq={openFaq()} toggleFaq={toggleFaq} />
      </main>

      <SiteFooter i18n={i18n} />
      <SiteToast visible={toastVisible()} message={toastMessage()} />
    </>
  )
}
