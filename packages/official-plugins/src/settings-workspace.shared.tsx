import { InlineError, Switch } from "@tabora/ui"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

export function SettingsInlineError(props: { children: string }) {
  return <InlineError>{props.children}</InlineError>
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
    <Switch
      checked={props.checked}
      size="sm"
      aria-label={props.label}
      onChange={() => props.onChange()}
    />
  )
}
