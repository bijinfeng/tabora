import { Clock, Link2, Pencil, Sun, Target, CheckSquare } from "lucide-solid"
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
