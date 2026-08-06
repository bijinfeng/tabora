/**
 * 管理后台自带明暗 token 集，沿用 DESIGN.md 的 Refined Sage 语义值。
 * 后台是独立运维应用，不依赖 official-plugins 的主题贡献，因此在此显式声明。
 */
type ThemeTokenSet = Record<string, string>

const shared: ThemeTokenSet = {
  "radius-1": "4px",
  "radius-2": "6px",
  "radius-control": "6px",
  "radius-card": "6px",
  "radius-panel": "8px",
  "radius-pill": "999px",
  "dur-fast": "120ms",
  "dur-normal": "180ms",
  ease: "cubic-bezier(0.2, 0, 0, 1)",
}

export const lightTokens: ThemeTokenSet = {
  ...shared,
  "color-page": "246 247 244",
  "color-surface": "255 255 255",
  "color-surface-soft": "250 250 248",
  "color-surface-hover": "242 244 240",
  "color-text": "28 30 28",
  "color-muted": "107 110 106",
  "color-subtle": "148 151 146",
  "color-inverse": "255 255 255",
  "color-line": "230 232 227",
  "color-line-strong": "209 212 206",
  "color-accent": "26 144 112",
  "color-accent-hover": "21 120 92",
  "color-accent-soft": "234 245 240",
  "color-danger": "201 69 69",
  "color-success": "45 138 94",
  "color-warning": "166 106 18",
  "color-info": "61 123 168",
  "color-focus": "26 144 112",
}

export const darkTokens: ThemeTokenSet = {
  ...shared,
  "color-page": "25 28 26",
  "color-surface": "37 41 39",
  "color-surface-soft": "42 46 44",
  "color-surface-hover": "50 55 52",
  "color-text": "237 240 237",
  "color-muted": "182 186 182",
  "color-subtle": "134 139 134",
  "color-inverse": "255 255 255",
  "color-line": "59 64 60",
  "color-line-strong": "83 89 84",
  "color-accent": "52 209 158",
  "color-accent-hover": "92 224 182",
  "color-accent-soft": "26 46 38",
  "color-danger": "239 139 139",
  "color-success": "79 196 154",
  "color-warning": "213 161 74",
  "color-info": "127 183 223",
  "color-focus": "52 209 158",
}
