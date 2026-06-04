import { createSignal, For, Show } from "solid-js"
import type { LayoutViewProps, PluginInstance } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { HostActionIcon } from "@tabora/workbench-shell"
import { Menu } from "lucide-solid"

const COLUMN_COUNT = 3

function splitIntoColumns(instances: PluginInstance[]): PluginInstance[][] {
  const columns: PluginInstance[][] = Array.from({ length: COLUMN_COUNT }, () => [])
  instances.forEach((inst, index) => {
    columns[index % COLUMN_COUNT]!.push(inst)
  })
  return columns
}

export function MasonryLayout(props: LayoutViewProps) {
  const [menuOpen, setMenuOpen] = createSignal(false)
  const masonry = () => props.regions["masonry"]
  const columns = () => splitIntoColumns(masonry()?.instances ?? [])

  return (
    <main class="layout-masonry" data-layout="diy-masonry">
      <div class="masonry-columns">
        <For each={columns()}>
          {(column) => (
            <div class="masonry-column">
              <For each={column}>{(inst) => masonry()!.renderInstance(inst)}</For>
            </div>
          )}
        </For>
      </div>
      <div class="masonry-fab-wrap">
        <button
          class="masonry-fab"
          aria-label="打开菜单"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Menu size={20} />
        </button>
        <Show when={menuOpen()}>
          <div class="masonry-menu" role="menu">
            <For each={props.host.getGlobalActions("menu")}>
              {(action) => (
                <button
                  class="masonry-menu-item"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    action.run()
                    setMenuOpen(false)
                  }}
                >
                  <HostActionIcon id={action.id} icon={action.icon} size={16} />
                  <span>{action.label}</span>
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </main>
  )
}

export const layoutDiyMasonry: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "community.layout.diy-masonry",
    name: "DIY Masonry Layout",
    version: "1.0.0",
    publisher: "community",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "community.layout.diy-masonry",
          title: "DIY 瀑布流布局",
          view: "community.layout.diy-masonry.view",
          regions: [{ id: "masonry", title: "瀑布流", accepts: ["widget"], required: true }],
          defaultRegions: {
            masonry: [
              { instanceId: "today-focus-1" },
              { instanceId: "quick-links-1" },
              { instanceId: "notes-1" },
              { instanceId: "todo-1" },
            ],
          },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("community.layout.diy-masonry.view", MasonryLayout)
  },
}
