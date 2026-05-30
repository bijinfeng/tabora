import { Breadcrumb as P } from "../../primitives/breadcrumb/breadcrumb"
import type { BreadcrumbProps, BreadcrumbItem } from "../../primitives/breadcrumb/breadcrumb"
import "./styles.css"
export function Breadcrumb(props: BreadcrumbProps) {
  return <P {...props} />
}
export type { BreadcrumbProps, BreadcrumbItem }
