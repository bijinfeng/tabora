import { SegmentedControl as Primitive } from "../../primitives/segmentedControl/segmentedControl"
import type {
  SegmentedControlProps,
  SegmentedControlOption,
} from "../../primitives/segmentedControl/segmentedControl"
import "./styles.css"

export function SegmentedControl<V extends string>(props: SegmentedControlProps<V>) {
  return <Primitive {...props} />
}
export type { SegmentedControlProps, SegmentedControlOption }
