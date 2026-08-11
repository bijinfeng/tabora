import * as stylex from "@stylexjs/stylex"
import { For } from "solid-js"
import type { LayoutHostAPI } from "@tabora/plugin-api/sdk"
import { IconButton } from "@tabora/ui/button"

import { HostActionIcon } from "./host-action-icon"
import { styles } from "./styles"

export function MobileBottomBar(props: { host: LayoutHostAPI }) {
  const railActions = () => props.host.getGlobalActions("rail")
  const utilityActions = () =>
    railActions().filter((action) => ["add-widget", "theme", "settings"].includes(action.id))

  return (
    <nav {...stylex.attrs(styles.bar)} data-workbench-mobile-bar aria-label="工作台导航">
      <For each={utilityActions()}>
        {(action) => (
          <IconButton
            size="md"
            xstyle={[styles.barButton, action.isActive && styles.barButtonActive]}
            aria-label={action.label}
            title={action.label}
            onClick={() => action.run()}
          >
            <HostActionIcon id={action.id} icon={action.icon} />
          </IconButton>
        )}
      </For>
    </nav>
  )
}
