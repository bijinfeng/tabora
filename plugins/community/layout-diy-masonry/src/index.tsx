import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutViewProps, PluginInstance } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { Menu } from "lucide-solid"
import * as stylex from "@stylexjs/stylex"

import { HostActionIcon } from "./host-action-icon"

const COLUMN_COUNT = 3

const styles = stylex.create({
  root: {
    minHeight: "100vh",
    padding: 24,
  },
  columns: {
    alignItems: "flex-start",
    display: "flex",
    gap: 16,
  },
  column: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: 16,
  },
  fabWrap: {
    bottom: 24,
    position: "fixed",
    right: 24,
  },
  fab: {
    alignItems: "center",
    backgroundColor: "rgb(var(--color-accent))",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "50%",
    boxShadow: "0 4px 12px rgb(var(--color-shadow) / 0.15)",
    color: "rgb(var(--color-inverse))",
    cursor: "pointer",
    display: "flex",
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  menu: {
    backgroundColor: "rgb(var(--color-surface))",
    borderRadius: "var(--tbr-radius-panel, 8px)",
    bottom: 56,
    boxShadow: "0 8px 24px rgb(var(--color-shadow) / 0.18)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: 8,
    position: "absolute",
    right: 0,
  },
  menuItem: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: 8,
    color: "rgb(var(--color-text))",
    cursor: "pointer",
    display: "flex",
    gap: 8,
    paddingBlock: 8,
    paddingInline: 12,
    textAlign: "left",
    whiteSpace: "nowrap",
    ":hover": {
      backgroundColor: "rgb(var(--color-surface-hover))",
    },
  },
  menuIcon: {
    color: "rgb(var(--color-muted))",
    display: "inline-flex",
    flexShrink: 0,
  },
})

function sx(
  style: stylex.StyleXStyles,
  className?: string,
): { class: string | undefined; style: JSX.CSSProperties } {
  const compiled = stylex.props(style)
  return {
    class: [compiled.className, className].filter(Boolean).join(" ") || undefined,
    style: compiled.style as JSX.CSSProperties,
  }
}

function splitIntoColumns(instances: PluginInstance[]): PluginInstance[][] {
  const columns: PluginInstance[][] = Array.from({ length: COLUMN_COUNT }, () => [])
  instances.forEach((inst, index) => {
    columns[index % COLUMN_COUNT]!.push(inst)
  })
  return columns
}

export function MasonryLayout(props: LayoutViewProps<JSX.Element>) {
  const [menuOpen, setMenuOpen] = createSignal(false)
  const masonry = () => props.regions["masonry"]
  const columns = () => splitIntoColumns(masonry()?.instances ?? [])

  return (
    <main {...sx(styles.root, "layout-masonry")} data-layout="diy-masonry">
      <div {...sx(styles.columns, "masonry-columns")}>
        <For each={columns()}>
          {(column) => (
            <div {...sx(styles.column, "masonry-column")}>
              <For each={column}>{(inst) => masonry()!.renderInstance(inst)}</For>
            </div>
          )}
        </For>
      </div>
      <div {...sx(styles.fabWrap, "masonry-fab-wrap")}>
        <button
          {...sx(styles.fab, "masonry-fab")}
          aria-label="打开菜单"
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Menu size={20} />
        </button>
        <Show when={menuOpen()}>
          <div {...sx(styles.menu, "masonry-menu")} role="menu">
            <For each={props.host.getGlobalActions("menu")}>
              {(action) => (
                <button
                  {...sx(styles.menuItem, "masonry-menu-item")}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    action.run()
                    setMenuOpen(false)
                  }}
                >
                  <span {...sx(styles.menuIcon)}>
                    <HostActionIcon id={action.id} icon={action.icon} size={16} />
                  </span>
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
    apiVersion: "1.0.0",
    publisher: "community",
    entry: "./index",
    styles: [{ href: "./styles.css", scope: "global", order: 20 }],
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
