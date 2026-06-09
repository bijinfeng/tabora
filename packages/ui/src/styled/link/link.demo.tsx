import { Link } from "./link.styled"

export function LinkDemo() {
  return (
    <div class="docs-row">
      <Link href="/docs">内部链接</Link>
      <Link href="https://example.com" external>
        外部链接
      </Link>
      <Link href="/docs" muted>
        静默链接
      </Link>
    </div>
  )
}
