import CheckSquare from "lucide-solid/icons/check-square"
import Clock from "lucide-solid/icons/clock"
import Sparkles from "lucide-solid/icons/sparkles"
import type { JSX } from "solid-js"

const pluginIconSources: Record<string, string> = {
  compress: new URL("../assets/plugin-icons/compress.svg", import.meta.url).href,
  drive: new URL("../assets/plugin-icons/drive.svg", import.meta.url).href,
  focus: new URL("../assets/plugin-icons/focus.svg", import.meta.url).href,
  links: new URL("../assets/plugin-icons/links.svg", import.meta.url).href,
  lottery: new URL("../assets/plugin-icons/lottery.svg", import.meta.url).href,
  notes: new URL("../assets/plugin-icons/notes.svg", import.meta.url).href,
  plugins: new URL("../assets/plugin-icons/plugins.svg", import.meta.url).href,
  stock: new URL("../assets/plugin-icons/stock.svg", import.meta.url).href,
  weather: new URL("../assets/plugin-icons/weather.svg", import.meta.url).href,
  target: new URL("../assets/plugin-icons/focus.svg", import.meta.url).href,
}

export function renderWorkbenchWidgetIcon(icon?: string): JSX.Element {
  const source = icon ? pluginIconSources[icon] : undefined
  if (source) return <img src={source} alt="" width={24} height={24} />

  switch (icon) {
    case "check-square":
      return <CheckSquare size={14} />
    case "sparkles":
      return <Sparkles size={14} />
    default:
      return <Clock size={14} />
  }
}
