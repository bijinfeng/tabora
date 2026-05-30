import { Slider as P } from "../../primitives/slider/slider"
import type { SliderProps } from "../../primitives/slider/slider"
import "./styles.css"
export function Slider(props: SliderProps) {
  return <P {...props} />
}
export type { SliderProps }
