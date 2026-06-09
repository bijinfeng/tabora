import { createSignal } from "solid-js"

import { Pagination } from "./pagination.styled"

export function PaginationDemo() {
  const [page, setPage] = createSignal(1)

  return <Pagination page={page()} total={5} onChange={setPage} />
}
