import { InlineError } from "@tabora/ui/inline-error"
import { Switch } from "@tabora/ui/switch"
import type { SettingsPanelData } from "@tabora/plugin-api/sdk"

export function SettingsInlineError(props: { children: string }) {
  return <InlineError>{props.children}</InlineError>
}

export function providerShortcut(
  provider: NonNullable<SettingsPanelData["searchProviders"]>[number],
) {
  return provider.shortcut ?? `@${provider.id.split(".").at(-1) ?? provider.id}`
}

export function providerAlias(provider: NonNullable<SettingsPanelData["searchProviders"]>[number]) {
  return providerShortcut(provider).startsWith("@")
    ? providerShortcut(provider)
    : `@${providerShortcut(provider)}`
}

export function providerKindLabel(
  provider: NonNullable<SettingsPanelData["searchProviders"]>[number],
) {
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
