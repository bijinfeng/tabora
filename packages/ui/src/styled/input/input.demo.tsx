import { createMemo, createSignal } from "solid-js"

import { Button } from "../button"
import { Field } from "../field"
import { InlineError } from "../inlineError"
import { Input } from "./input.styled"

export function InputDemo() {
  const [workspaceName, setWorkspaceName] = createSignal("Tabora Docs")
  const [searchUrl, setSearchUrl] = createSignal("https://example.com/search?q=%s")
  const [savedUrl, setSavedUrl] = createSignal("https://example.com/search?q=%s")

  const urlError = createMemo(() => {
    const value = searchUrl().trim()
    if (!value.startsWith("https://")) return "搜索 URL 必须使用 https://"
    if (!value.includes("%s")) return "搜索 URL 需要保留 %s 作为查询占位符"
    return ""
  })

  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>工作区搜索设置</strong>
        <span>演示内容区表单里标签、说明、错误与保存后摘要的组合方式。</span>
      </div>
      <Field
        label="工作区标题"
        helper="显示在搜索栏上方，用于区分不同工作区。"
        htmlFor="docs-workspace-name"
      >
        <Input id="docs-workspace-name" value={workspaceName()} onInput={setWorkspaceName} />
      </Field>
      <Field
        label="默认搜索 URL"
        helper="保留 %s 作为关键词占位符，提交时会替换为真实查询。"
        htmlFor="docs-search-url"
      >
        <Input
          id="docs-search-url"
          type="url"
          value={searchUrl()}
          onInput={setSearchUrl}
          invalid={Boolean(urlError())}
        />
      </Field>
      {urlError() ? (
        <InlineError>
          {urlError()}
          <Button size="sm" variant="danger-subtle" onClick={() => setSearchUrl(savedUrl())}>
            恢复上次保存
          </Button>
        </InlineError>
      ) : null}
      <div class="docs-row">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setSearchUrl("https://example.com/search?q=%s")}
        >
          载入模板
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (!urlError()) setSavedUrl(searchUrl())
          }}
          disabled={Boolean(urlError())}
        >
          保存设置
        </Button>
      </div>
      <div class="docs-stack compact">
        <span>已保存工作区：{workspaceName()}</span>
        <code>{savedUrl()}</code>
      </div>
    </div>
  )
}
