import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { SettingsSectionId } from "@tabora/plugin-api"
import { Input } from "@tabora/ui/input"
import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import ChevronRight from "lucide-solid/icons/chevron-right"
import Info from "lucide-solid/icons/info"
import Mic from "lucide-solid/icons/mic"
import Palette from "lucide-solid/icons/palette"
import Puzzle from "lucide-solid/icons/puzzle"
import RefreshCw from "lucide-solid/icons/refresh-cw"
import Search from "lucide-solid/icons/search"
import Settings from "lucide-solid/icons/settings"
import Sparkles from "lucide-solid/icons/sparkles"
import UserRound from "lucide-solid/icons/user-round"

export type MobileSettingsIndexProps = {
  title: string
  searchPlaceholder: string
  sectionTitle: (sectionId: SettingsSectionId) => string
  sectionDescription: (sectionId: SettingsSectionId) => string
  sectionMeta?: (sectionId: SettingsSectionId) => string
  onSectionChange: (sectionId: SettingsSectionId) => void
  onKeyDown: (event: KeyboardEvent) => void
}

const MOBILE_SETTINGS_GROUPS: Array<{
  id: "account" | "workspace" | "services"
  sections: SettingsSectionId[]
}> = [
  { id: "account", sections: ["account"] },
  { id: "workspace", sections: ["general", "appearance", "search"] },
  { id: "services", sections: ["ai", "sync", "plugins", "about"] },
]

const INDEX_SECTION_META_FALLBACK: Record<SettingsSectionId, string> = {
  general: "本地保存",
  appearance: "即时生效",
  search: "快捷入口",
  account: "未登录",
  ai: "首次授权",
  sync: "V1",
  plugins: "插件状态",
  about: "V2",
}

const styles = stylex.create({
  page: {
    backgroundColor: color.page,
    color: color.text,
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    overflow: "hidden",
    width: "100%",
  },
  scroll: {
    boxSizing: "border-box",
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: 16,
    minHeight: 0,
    overflowX: "hidden",
    overflowY: "auto",
    paddingBottom: "calc(28px + env(safe-area-inset-bottom))",
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: "calc(24px + env(safe-area-inset-top))",
    width: "100%",
  },
  title: {
    color: color.text,
    fontSize: 32,
    fontWeight: font.bold,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    margin: 0,
    paddingLeft: 4,
  },
  search: {
    width: "100%",
  },
  searchControl: {
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderRadius: radius.control,
    fontSize: 14,
    height: 44,
    paddingLeft: 42,
    paddingRight: 42,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.surfaceHover,
    },
    ":focus": {
      backgroundColor: color.surface,
      borderColor: color.accent,
    },
  },
  groups: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  group: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderStyle: "solid",
    borderWidth: 0,
    color: color.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    gap: 12,
    minHeight: 60,
    paddingBlock: 10,
    paddingLeft: 14,
    paddingRight: 12,
    textAlign: "left",
    transitionDuration: motion.fast,
    transitionProperty: "background-color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
    ":focus-visible": {
      outlineColor: color.focus,
      outlineOffset: -3,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  itemDivider: {
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
  },
  icon: {
    alignItems: "center",
    borderRadius: "50%",
    color: color.inverse,
    display: "flex",
    flexShrink: 0,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  iconBlue: {
    backgroundColor: color.info,
  },
  iconGreen: {
    backgroundColor: color.success,
  },
  iconOrange: {
    backgroundColor: color.warning,
  },
  iconPurple: {
    backgroundColor: color.accent,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    display: "block",
    fontSize: 14,
    fontWeight: font.semibold,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemDescription: {
    color: color.textMuted,
    display: "block",
    fontSize: 12,
    lineHeight: 1.35,
    marginTop: 3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemTrailing: {
    alignItems: "center",
    color: color.textSubtle,
    display: "flex",
    flexShrink: 0,
    gap: 2,
  },
  itemMeta: {
    color: color.textMuted,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  empty: {
    color: color.textMuted,
    fontSize: 14,
    margin: 0,
    paddingBlock: 28,
    textAlign: "center",
  },
})

export function MobileSettingsIndex(props: MobileSettingsIndexProps) {
  const [query, setQuery] = createSignal("")
  const sectionMeta = (sectionId: SettingsSectionId) =>
    props.sectionMeta?.(sectionId) ?? INDEX_SECTION_META_FALLBACK[sectionId]
  const sectionsForGroup = (group: (typeof MOBILE_SETTINGS_GROUPS)[number]) => {
    const normalizedQuery = query().trim().toLocaleLowerCase()
    if (!normalizedQuery) return group.sections
    return group.sections.filter((sectionId) =>
      [
        props.sectionTitle(sectionId),
        props.sectionDescription(sectionId),
        sectionMeta(sectionId),
      ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
    )
  }
  const hasResults = createMemo(() =>
    MOBILE_SETTINGS_GROUPS.some((group) => sectionsForGroup(group).length > 0),
  )

  const renderIcon = (sectionId: SettingsSectionId) => {
    let icon: JSX.Element
    if (sectionId === "account") icon = <UserRound size={20} strokeWidth={2.25} />
    else if (sectionId === "general") icon = <Settings size={20} strokeWidth={2.25} />
    else if (sectionId === "appearance") icon = <Palette size={20} strokeWidth={2.25} />
    else if (sectionId === "search") icon = <Search size={20} strokeWidth={2.25} />
    else if (sectionId === "ai") icon = <Sparkles size={20} strokeWidth={2.25} />
    else if (sectionId === "sync") icon = <RefreshCw size={20} strokeWidth={2.25} />
    else if (sectionId === "plugins") icon = <Puzzle size={20} strokeWidth={2.25} />
    else icon = <Info size={20} strokeWidth={2.25} />

    const iconStyle =
      sectionId === "account" || sectionId === "appearance" || sectionId === "about"
        ? styles.iconOrange
        : sectionId === "general" || sectionId === "search" || sectionId === "plugins"
          ? styles.iconBlue
          : sectionId === "sync"
            ? styles.iconGreen
            : styles.iconPurple

    return <div {...stylex.attrs(styles.icon, iconStyle)}>{icon}</div>
  }

  return (
    <main
      {...stylex.attrs(styles.page)}
      data-settings-page
      data-settings-index
      data-settings-surface="mobile"
      onKeyDown={props.onKeyDown}
      aria-label={props.title}
    >
      <div {...stylex.attrs(styles.scroll)}>
        <h1 {...stylex.attrs(styles.title)}>{props.title}</h1>
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
          fallback={<p {...stylex.attrs(styles.empty)}>没有匹配的设置项</p>}
        >
          <div {...stylex.attrs(styles.groups)}>
            <For each={MOBILE_SETTINGS_GROUPS}>
              {(group) => {
                const sections = () => sectionsForGroup(group)
                return (
                  <Show when={sections().length > 0}>
                    <section {...stylex.attrs(styles.group)} data-settings-index-group={group.id}>
                      <For each={sections()}>
                        {(sectionId, index) => (
                          <button
                            type="button"
                            {...stylex.attrs(
                              styles.item,
                              index() < sections().length - 1 ? styles.itemDivider : null,
                            )}
                            data-settings-index-item={sectionId}
                            onClick={() => props.onSectionChange(sectionId)}
                          >
                            {renderIcon(sectionId)}
                            <span {...stylex.attrs(styles.itemCopy)}>
                              <strong {...stylex.attrs(styles.itemTitle)}>
                                {props.sectionTitle(sectionId)}
                              </strong>
                              <span {...stylex.attrs(styles.itemDescription)}>
                                {props.sectionDescription(sectionId)}
                              </span>
                            </span>
                            <span {...stylex.attrs(styles.itemTrailing)}>
                              <span {...stylex.attrs(styles.itemMeta)}>
                                {sectionMeta(sectionId)}
                              </span>
                              <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
                            </span>
                          </button>
                        )}
                      </For>
                    </section>
                  </Show>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </main>
  )
}
