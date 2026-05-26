import { createSignal, For, Show } from "solid-js"
import { officialPlugins } from "@tabora/official-plugins"
import { createPluginKernel } from "@tabora/platform-kernel"
import { applyThemeTokens } from "@tabora/theme"

type WorkbenchCard = {
  id: string
  title: string
  viewId: string
  size: "S" | "M" | "L" | "XL"
}

const cards: WorkbenchCard[] = [
  {
    id: "quick-links-1",
    title: "快捷入口",
    viewId: "official.widgets.quick-links.card",
    size: "M",
  },
  { id: "notes-1", title: "便签", viewId: "official.widgets.notes.card", size: "M" },
]

export function App() {
  const [kernelReady, setKernelReady] = createSignal(false)
  const kernel = createPluginKernel()

  void kernel.discover(officialPlugins).then(async () => {
    await kernel.activateEnabledPlugins()
    applyThemeTokens(document.documentElement, {
      "color-page": "237 241 238",
      "color-surface": "255 255 255",
      "color-text": "31 35 32",
      "color-muted": "102 112 105",
      "color-accent": "35 113 89",
      "color-line": "210 218 213",
      "radius-card": "16px",
    })
    setKernelReady(true)
  })

  const SearchView = () => kernel.registry.views.get("official.search.command-bar.view")

  return (
    <div class="tabora-root">
      <Show when={kernelReady()} fallback={<div class="loading">Loading Tabora...</div>}>
        <header class="topbar">{SearchView()({})}</header>
        <section class="workbench-grid">
          <For each={cards}>
            {(card) => {
              const View = kernel.registry.views.get(card.viewId)
              return (
                <div class={`grid-item size-${card.size.toLowerCase()}`} aria-label={card.title}>
                  {View({})}
                </div>
              )
            }}
          </For>
        </section>
      </Show>
    </div>
  )
}
