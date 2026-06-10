import { For } from "solid-js"
import { ChevronLeft, ChevronRight } from "lucide-solid"

export type PaginationProps = {
  page: number
  total: number
  onChange: (page: number) => void
  class?: string
}

export function Pagination(props: PaginationProps) {
  const pages = () => {
    const p: (number | "...")[] = []
    for (let i = 1; i <= props.total; i++) {
      if (i === 1 || i === props.total || (i >= props.page - 1 && i <= props.page + 1)) p.push(i)
      else if (p[p.length - 1] !== "...") p.push("...")
    }
    return p
  }
  return (
    <div class={`tbr-pagination ${props.class ?? ""}`}>
      <button
        class="tbr-page-btn"
        disabled={props.page <= 1}
        onClick={() => props.onChange(props.page - 1)}
        aria-label="上一页"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <For each={pages()}>
        {(p) =>
          p === "..." ? (
            <span class="tbr-page-ellipsis">...</span>
          ) : (
            <button
              class="tbr-page-btn"
              data-active={p === props.page ? "" : undefined}
              onClick={() => props.onChange(p as number)}
              aria-current={p === props.page ? "page" : undefined}
            >
              {p}
            </button>
          )
        }
      </For>
      <button
        class="tbr-page-btn"
        disabled={props.page >= props.total}
        onClick={() => props.onChange(props.page + 1)}
        aria-label="下一页"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
