import { createExtensionHostAdapter } from "@tabora/host-adapters"
import { officialPlugins } from "@tabora/official-plugins"
import { createWorkbenchComposition, createWorkbenchRuntimeBootstrap } from "@tabora/workbench-app"

export function createExtensionWorkbenchComposition() {
  return createWorkbenchComposition({
    host: createExtensionHostAdapter({
      id: "host.extension.newtab",
    }),
  })
}

export function createExtensionRuntimeBootstrap() {
  const composition = createExtensionWorkbenchComposition()

  return createWorkbenchRuntimeBootstrap({
    host: composition.host,
    plugins: officialPlugins,
    databaseName: "tabora-extension",
  })
}
