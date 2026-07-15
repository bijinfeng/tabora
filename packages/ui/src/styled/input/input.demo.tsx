import { createSignal } from "solid-js"
import { Search, Calendar } from "lucide-solid"

import { Input } from "./input.styled"
import { InlineError } from "../inlineError"
import "./input.demo.css"

export function InputDemo() {
  const [searchText, setSearchText] = createSignal("")
  const [dateText, setDateText] = createSignal("2026-06-24")
  const [clearableText, setClearableText] = createSignal("可清除文本")
  const [urlText, setUrlText] = createSignal("https://example.com")
  const [password, setPassword] = createSignal("secret")
  const [placeholder, setPlaceholder] = createSignal("")
  const [filled, setFilled] = createSignal("已输入")
  const [invalid, setInvalid] = createSignal("校验失败")
  const [small, setSmall] = createSignal("")

  return (
    <div class="docs-control-stack">
      <div class="demo-section">
        <h4>工作区搜索设置</h4>
        <div class="demo-row">
          <Input
            value={searchText()}
            onInput={setSearchText}
            leadingIcon={<Search size={16} strokeWidth={2} />}
            placeholder="按名称过滤搜索源..."
            aria-label="工作区搜索设置"
          />
        </div>
        <div style={{ "margin-top": "8px" }}>
          <InlineError>搜索源列表不可用，请稍后重试。</InlineError>
        </div>
      </div>

      <div class="demo-section">
        <h4>前后图标 + 清除</h4>
        <div class="demo-row">
          <Input
            value={searchText()}
            onInput={setSearchText}
            leadingIcon={<Search size={16} strokeWidth={2} />}
            placeholder="搜索..."
            aria-label="搜索输入"
          />
          <Input
            value={clearableText()}
            onInput={setClearableText}
            clearable
            placeholder="可清除输入..."
            aria-label="可清除输入"
          />
          <Input
            value={urlText()}
            onInput={setUrlText}
            leadingIcon={<span style={{ "font-size": "11px", "font-weight": "600" }}>URL</span>}
            clearable
            placeholder="URL..."
            aria-label="URL 输入"
          />
          <Input
            value={dateText()}
            onInput={setDateText}
            trailingIcon={<Calendar size={16} strokeWidth={2} />}
            aria-label="日期输入"
          />
        </div>
      </div>

      <div class="demo-section">
        <h4>密码显隐</h4>
        <div class="demo-row">
          <Input
            value={password()}
            onInput={setPassword}
            type="password"
            placeholder="输入密码..."
            aria-label="密码输入"
          />
        </div>
      </div>

      <div class="demo-section">
        <h4>状态与尺寸</h4>
        <div class="demo-row">
          <Input
            value={placeholder()}
            onInput={setPlaceholder}
            placeholder="占位"
            aria-label="占位示例"
          />
          <Input value={filled()} onInput={setFilled} aria-label="已输入示例" />
          <Input value={invalid()} onInput={setInvalid} invalid aria-label="校验失败示例" />
          <Input value="禁用" onInput={() => {}} disabled aria-label="禁用示例" />
          <Input
            value={small()}
            onInput={setSmall}
            size="sm"
            placeholder="小尺寸"
            aria-label="小尺寸示例"
          />
        </div>
      </div>
    </div>
  )
}
