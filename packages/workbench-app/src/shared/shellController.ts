import type { PluginManifest, PluginPermissionGrant } from "@tabora/plugin-api"

export function canPluginOpenExternal(options: {
  pluginId: string
  url: string
  plugins: Array<{
    manifest: Pick<PluginManifest, "id">
    installation: { grantedPermissions: PluginPermissionGrant[] }
  }>
}): boolean {
  let hostname: string
  try {
    hostname = new URL(options.url).hostname
  } catch {
    return false
  }

  const plugin = options.plugins.find((item) => item.manifest.id === options.pluginId)
  if (!plugin) return false

  return plugin.installation.grantedPermissions.some((permission) => {
    if (permission.type !== "external-open") return false
    return permission.hosts.some((host) => host === "*" || host === hostname)
  })
}
