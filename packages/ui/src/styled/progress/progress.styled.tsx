import { Progress as P } from "../../primitives/progress/progress"
import type { ProgressProps } from "../../primitives/progress/progress"
import "./styles.css"
export function Progress(props: ProgressProps) {
  return <P {...props} class="tbr-progress" />
}
export type { ProgressProps }
