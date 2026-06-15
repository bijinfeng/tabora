import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js"

import { useSiteI18n, useSiteTheme } from "../../app/AppShell"
import { PrototypeTopnav } from "../../shared/PrototypeTopnav"
import { SiteFooter } from "../../shared/SiteFooter"
import { SiteToast } from "../../shared/SiteToast"
import { CommandDialog } from "./components/CommandDialog"
import { FeatureSections } from "./components/FeatureSections"
import { HeroSection } from "./components/HeroSection"
import { homePrototypeContent } from "./homePrototypeContent"

export function HomePage() {
  const theme = useSiteTheme()
  const i18n = useSiteI18n()
  const content = createMemo(() => homePrototypeContent[i18n.locale()])
  const [commandOpen, setCommandOpen] = createSignal(false)
  const [toastMessage, setToastMessage] = createSignal("")
  const [toastVisible, setToastVisible] = createSignal(false)
  let toastTimer = 0
  let commandTrigger: HTMLElement | null = null
  let commandInputRef: HTMLInputElement | null = null

  const showToast = (message: string) => {
    window.clearTimeout(toastTimer)
    setToastMessage(message)
    setToastVisible(true)
    toastTimer = window.setTimeout(() => setToastVisible(false), 2600)
  }

  const openCommand = (trigger?: HTMLElement) => {
    commandTrigger = trigger ?? (document.activeElement as HTMLElement | null) ?? null
    setCommandOpen(true)
  }

  const closeCommand = () => {
    if (!commandOpen()) return
    setCommandOpen(false)
    commandTrigger?.focus?.()
  }

  createEffect(() => {
    if (!commandOpen()) return
    queueMicrotask(() => commandInputRef?.focus())
  })

  onMount(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        openCommand()
        return
      }

      if (event.key === "Escape") {
        closeCommand()
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
        event.preventDefault()
        theme.toggleDark()
        showToast(theme.dark() ? i18n.t("toast.theme.dark") : i18n.t("toast.theme.light"))
      }
    }

    window.addEventListener("keydown", onKeydown)

    onCleanup(() => {
      window.removeEventListener("keydown", onKeydown)
      window.clearTimeout(toastTimer)
    })
  })

  return (
    <>
      <PrototypeTopnav
        active="home"
        actions={[{ href: "/download", label: i18n.t("nav.download"), variant: "primary" }]}
        onThemeToggled={showToast}
      />

      <main>
        <HeroSection content={content()} />
        <FeatureSections content={content()} i18n={i18n} showToast={showToast} />
      </main>

      <SiteFooter i18n={i18n} />
      <CommandDialog
        content={content()}
        open={commandOpen()}
        close={closeCommand}
        setInputRef={(element) => (commandInputRef = element)}
      />
      <SiteToast visible={toastVisible()} message={toastMessage()} />
    </>
  )
}
