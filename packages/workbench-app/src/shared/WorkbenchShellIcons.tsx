import CheckSquare from "lucide-solid/icons/check-square"
import Clock from "lucide-solid/icons/clock"
import Link2 from "lucide-solid/icons/link-2"
import Pencil from "lucide-solid/icons/pencil"
import Sun from "lucide-solid/icons/sun"
import Target from "lucide-solid/icons/target"
import type { JSX } from "solid-js"

export function renderWorkbenchWidgetIcon(icon?: string): JSX.Element {
  switch (icon) {
    case "target":
      return <Target size={14} />
    case "link":
      return <Link2 size={14} />
    case "pencil":
      return <Pencil size={14} />
    case "check-square":
      return <CheckSquare size={14} />
    case "sun":
      return <Sun size={14} />
    default:
      return <Clock size={14} />
  }
}
