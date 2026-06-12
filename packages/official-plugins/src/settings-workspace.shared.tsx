import type { SettingsPanelViewProps } from "@tabora/plugin-api"

export function SettingsInlineError(props: { children: string }) {
  return <div class="settings-inline-error">{props.children}</div>
}

export function providerShortcut(provider: SettingsPanelViewProps["searchProviders"][number]) {
  return provider.shortcut ?? `@${provider.id.split(".").at(-1) ?? provider.id}`
}

export function providerAlias(provider: SettingsPanelViewProps["searchProviders"][number]) {
  return providerShortcut(provider).startsWith("@")
    ? providerShortcut(provider)
    : `@${providerShortcut(provider)}`
}

export function providerKindLabel(provider: SettingsPanelViewProps["searchProviders"][number]) {
  if (provider.id.includes("github")) return "代码"
  return "搜索"
}

export function SettingsSwitch(props: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label class="sw-wrap">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
        aria-label={props.label}
      />
      <span class="sw-track">
        <span class="sw-thumb" />
      </span>
    </label>
  )
}
