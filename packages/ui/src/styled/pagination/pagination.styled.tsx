import { Pagination as P } from "../../primitives/pagination/pagination"
import type { PaginationProps } from "../../primitives/pagination/pagination"
import "./styles.css"
export function Pagination(props: PaginationProps) {
  return <P {...props} />
}
export type { PaginationProps }
