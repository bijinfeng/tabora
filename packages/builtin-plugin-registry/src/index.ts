import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { layoutDiyMasonry } from "@tabora/layout-diy-masonry"
import { officialPlugins } from "@tabora/official-plugins"

export { officialPlugins }

export const builtinPlugins: BuiltinPlugin[] = [...officialPlugins, layoutDiyMasonry]
