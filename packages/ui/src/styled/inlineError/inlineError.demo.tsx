import { Button } from "../button"
import { InlineError } from "./inlineError.styled"

export function InlineErrorDemo() {
  return (
    <InlineError>
      加载天气失败。
      <Button size="sm" variant="danger-subtle">
        重试
      </Button>
    </InlineError>
  )
}
