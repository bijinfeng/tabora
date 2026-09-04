import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { SettingsSectionId } from "@tabora/plugin-api"
import { Input } from "@tabora/ui/input"
import Mic from "lucide-solid/icons/mic"
import Search from "lucide-solid/icons/search"
import { MobileSettingsHeader } from "../MobileSettingsHeader"
import type { MobileSettingsIndexProps } from "./types"
import { styles } from "./styles"
import { MOBILE_SETTINGS_GROUPS, INDEX_SECTION_META_FALLBACK } from "./constants"
import { MobileSettingsGroup } from "./MobileSettingsGroup"

export function MobileSettingsIndex(props: MobileSettingsIndexProps) {
  const [query, setQuery] = createSignal("")

  const sectionMeta = (sectionId: SettingsSectionId) =>
    props.sectionMeta?.(sectionId) ?? INDEX_SECTION_META_FALLBACK[sectionId]

  const sectionsForGroup = (group: (typeof MOBILE_SETTINGS_GROUPS)[number]) => {
    const visibleSections = group.sections.filter((sectionId) =>
      props.visibleSections.includes(sectionId),
    )
    const normalizedQuery = query().trim().toLocaleLowerCase()
    if (!normalizedQuery) return visibleSections
    return visibleSections.filter((sectionId) =>
      [
        props.sectionTitle(sectionId),
        props.sectionDescription(sectionId),
        sectionMeta(sectionId),
      ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
    )
  }

  const groupsWithSections = createMemo(() =>
    MOBILE_SETTINGS_GROUPS.map((group) => ({
      ...group,
      sections: sectionsForGroup(group),
    })).filter((group) => group.sections.length > 0),
  )

  const hasResults = createMemo(() => groupsWithSections().length > 0)

  return (
    <main
      {...stylex.attrs(styles.page)}
      data-settings-page
      data-settings-index
      data-settings-surface="mobile"
      aria-label={props.title}
    >
      <MobileSettingsHeader
        title={props.title}
        onBack={props.onClose}
        backAriaLabel={props.backAriaLabel ?? "返回"}
      />
      <div {...stylex.attrs(styles.scroll)}>
        <Input
          value={query()}
          onInput={setQuery}
          type="search"
          placeholder={props.searchPlaceholder}
          aria-label={props.searchPlaceholder}
          leadingIcon={<Search size={20} strokeWidth={2} />}
          trailingIcon={<Mic size={20} strokeWidth={2} />}
          xstyle={styles.search}
          controlXstyle={styles.searchControl}
          inputAttrs={{ "data-settings-index-search": "" }}
        />
        <Show
          when={hasResults()}
          fallback={
            <p {...stylex.attrs(styles.empty)} data-settings-index-empty>
              无匹配的设置项
            </p>
          }
        >
          <div {...stylex.attrs(styles.list)}>
            <For each={groupsWithSections()}>
              {(group) => (
                <Show when={group.sections.length > 0}>
                  <MobileSettingsGroup
                    id={group.id}
                    title={group.title}
                    sections={group.sections}
                    sectionTitle={props.sectionTitle}
                    sectionDescription={props.sectionDescription}
                    sectionMeta={sectionMeta}
                    onSectionChange={props.onSectionChange}
                  />
                </Show>
              )}
            </For>
          </div>
        </Show>
      </div>
    </main>
  )
}
