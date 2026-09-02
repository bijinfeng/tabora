import * as stylex from "@stylexjs/stylex"
import { For } from "solid-js"
import type { SettingsSectionId } from "@tabora/plugin-api"
import ChevronRight from "lucide-solid/icons/chevron-right"
import { styles } from "./styles"
import { getSectionIcon, getSectionIconColor } from "./sectionIcons"

type MobileSettingsGroupProps = {
  id: string
  title: string
  sections: SettingsSectionId[]
  sectionTitle: (sectionId: SettingsSectionId) => string
  sectionDescription: (sectionId: SettingsSectionId) => string
  sectionMeta: (sectionId: SettingsSectionId) => string
  onSectionChange: (sectionId: SettingsSectionId) => void
}

export function MobileSettingsGroup(props: MobileSettingsGroupProps) {
  const getIconStyle = (sectionId: SettingsSectionId) => {
    const color = getSectionIconColor(sectionId)
    if (color === "orange") return styles.iconOrange
    if (color === "blue") return styles.iconBlue
    if (color === "green") return styles.iconGreen
    return styles.iconPurple
  }

  return (
    <section {...stylex.attrs(styles.group)} data-settings-index-group={props.id}>
      <h2 {...stylex.attrs(styles.groupTitle)}>{props.title}</h2>
      <div {...stylex.attrs(styles.groupList)}>
        <For each={props.sections}>
          {(sectionId) => (
            <button
              type="button"
              {...stylex.attrs(styles.item)}
              data-settings-index-item={sectionId}
              onClick={() => props.onSectionChange(sectionId)}
            >
              <span {...stylex.attrs(styles.itemLeading)}>
                <div {...stylex.attrs(styles.icon, getIconStyle(sectionId))}>
                  {getSectionIcon(sectionId)}
                </div>
                <span {...stylex.attrs(styles.itemContent)}>
                  <strong {...stylex.attrs(styles.itemTitle)}>
                    {props.sectionTitle(sectionId)}
                  </strong>
                  <span {...stylex.attrs(styles.itemDescription)}>
                    {props.sectionDescription(sectionId)}
                  </span>
                </span>
              </span>
              <span {...stylex.attrs(styles.itemTrailing)}>
                <span {...stylex.attrs(styles.itemMeta)}>{props.sectionMeta(sectionId)}</span>
                <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
              </span>
            </button>
          )}
        </For>
      </div>
    </section>
  )
}
