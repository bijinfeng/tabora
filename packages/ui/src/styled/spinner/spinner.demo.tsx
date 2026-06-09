import { Spinner } from "./spinner.styled"

export function SpinnerDemo() {
  return (
    <div class="docs-row">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
      <span class="docs-inline-status">
        <Spinner size="sm" />
        加载中...
      </span>
    </div>
  )
}
