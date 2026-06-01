import { Pagination } from "@tabora/ui"
import { createSignal } from "solid-js"

export default {
  title: "Navigation/Pagination",
  component: Pagination,
}

export const Default = {
  render: () => {
    const [page, setPage] = createSignal(1)
    return <Pagination total={10} page={page()} onChange={setPage} />
  },
}

export const FirstPage = {
  render: () => {
    const [page, setPage] = createSignal(1)
    return <Pagination total={5} page={page()} onChange={setPage} />
  },
}

export const MiddlePage = {
  render: () => {
    const [page, setPage] = createSignal(10)
    return <Pagination total={20} page={page()} onChange={setPage} />
  },
}

export const LastPage = {
  render: () => {
    const [page, setPage] = createSignal(10)
    return <Pagination total={10} page={page()} onChange={setPage} />
  },
}

export const FewPages = {
  render: () => {
    const [page, setPage] = createSignal(1)
    return <Pagination total={3} page={page()} onChange={setPage} />
  },
}

export const SinglePage = {
  render: () => {
    const [page, setPage] = createSignal(1)
    return <Pagination total={1} page={page()} onChange={setPage} />
  },
}
