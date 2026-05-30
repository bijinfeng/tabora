/** Variant API — 类似 class-variance-authority 的最小实现 */
type VariantMap = Record<string, string>
type VariantConfig = {
  base?: string
  variants?: Record<string, VariantMap>
  defaultVariants?: Record<string, string>
}

export function tv(config: VariantConfig) {
  return (props: Record<string, string | undefined>): string => {
    const classes: string[] = []
    if (config.base) classes.push(config.base)
    if (!config.variants) return classes.join(" ")
    for (const [key, variants] of Object.entries(config.variants)) {
      const value = props[key] ?? config.defaultVariants?.[key]
      if (value && variants[value]) classes.push(variants[value])
    }
    return classes.join(" ")
  }
}
