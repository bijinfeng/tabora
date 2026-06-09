import { createSignal } from "solid-js"

import { TagInput } from "./tagInput.styled"

export function TagInputDemo() {
  const [tags, setTags] = createSignal(["设计", "组件", "插件"])

  return <TagInput value={tags()} onChange={setTags} aria-label="标签" placeholder="输入标签..." />
}
