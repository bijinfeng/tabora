import { createMemo, onCleanup, onMount } from "solid-js"

import { useSiteI18n } from "../../app/AppShell"
import { PrototypeTopnav } from "../../shared/PrototypeTopnav"

import docsPrototypeHtml from "../../../../../docs/design/docs.html?raw"

const docsPrototypeCss = docsPrototypeHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ""

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const guessLanguage = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json"
  if (trimmed.includes("<") && trimmed.includes(">")) return "html"
  if (/(^|\n)\s*(pnpm|npm|yarn|bun)\s+/.test(value) || /(^|\n)\s*#/.test(value)) return "bash"
  return "plain"
}

const highlightJson = (value: string) => {
  const escaped = escapeHtml(value)
  const withStrings = escaped.replace(
    /&quot;([^&]|&(?!quot;))*?&quot;/g,
    (match, _content, offset, full) => {
      const after = full.slice(offset + match.length)
      const isKey = /^\s*:/.test(after)
      const cls = isKey ? "tbr-syn-attr" : "tbr-syn-string"
      return `<span class="${cls}">${match}</span>`
    },
  )

  return withStrings
    .replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
      return `<span class="tbr-syn-number">${match}</span>`
    })
    .replace(/\b(true|false|null)\b/g, (match) => {
      return `<span class="tbr-syn-keyword">${match}</span>`
    })
    .replace(/[{}[\],:]/g, (match) => {
      return `<span class="tbr-syn-punct">${match}</span>`
    })
}

const highlightBash = (value: string) => {
  const escaped = escapeHtml(value)
  const withComments = escaped.replace(/(^|\n)\s*#.*$/g, (match) => {
    return `<span class="tbr-syn-comment">${match}</span>`
  })

  const withStrings = withComments.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => {
    return `<span class="tbr-syn-string">${match}</span>`
  })

  return withStrings.replace(/(^|\s)(--?[\w-]+)/g, (match, space, flag) => {
    return `${space}<span class="tbr-syn-keyword">${flag}</span>`
  })
}

const highlightHtmlCode = (value: string) => {
  const escaped = escapeHtml(value)
  const withComments = escaped.replace(/&lt;!--[\s\S]*?--&gt;/g, (match) => {
    return `<span class="tbr-syn-comment">${match}</span>`
  })

  return withComments.replace(/&lt;\/?[\w:-]+[\s\S]*?&gt;/g, (match) => {
    const inner = match.slice(4, -4)
    const isClose = inner.startsWith("/")
    const withoutSlash = isClose ? inner.slice(1) : inner
    const tagName = withoutSlash.match(/^[^\s]+/)?.[0] ?? withoutSlash
    const rest = withoutSlash.slice(tagName.length)
    const tagHead = `${isClose ? "/" : ""}${tagName}`

    const highlightedRest = rest
      .replace(/\s([\w:-]+)(?==)/g, (_m, name: string) => {
        return ` <span class="tbr-syn-attr">${name}</span>`
      })
      .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (valueMatch) => {
        return `<span class="tbr-syn-string">${valueMatch}</span>`
      })

    return `<span class="tbr-syn-punct">&lt;</span><span class="tbr-syn-tag">${tagHead}</span>${highlightedRest}<span class="tbr-syn-punct">&gt;</span>`
  })
}

const highlightCode = (value: string) => {
  const lang = guessLanguage(value)
  if (lang === "json") return highlightJson(value)
  if (lang === "html") return highlightHtmlCode(value)
  if (lang === "bash") return highlightBash(value)
  const escaped = escapeHtml(value)
  return escaped
    .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => {
      return `<span class="tbr-syn-string">${match}</span>`
    })
    .replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
      return `<span class="tbr-syn-number">${match}</span>`
    })
}

const docsEnglishReplacements: Array<[string, string]> = [
  ["快速开始", "Quick start"],
  ["贡献点类型", "Contribution types"],
  ["标签与结构", "Labels and structure"],
  ["Badge 徽标", "Badge"],
  ["Table 表格", "Table"],
  ["Card 卡片", "Card"],
  ["三步创建第一个 Tabora 插件", "Create your first Tabora plugin in three steps"],
  [
    "Tabora 插件目录保持极简：manifest 声明贡献点，组件文件只负责插件内容区，宿主能力通过 runtime context 请求，不存在直接 DOM 操控。",
    "The Tabora plugin folder stays minimal: the manifest declares contributions, component files only render plugin content, and host capabilities are requested through runtime context without direct DOM control.",
  ],
  ["1 — 创建目录结构", "1 — Create the folder structure"],
  ["2 — 目录结构", "2 — Folder structure"],
  ["文件树", "file tree"],
  ["3 — 最小 manifest", "3 — Minimal manifest"],
  [
    "Manifest 只描述能力，不写宿主实现",
    "Manifest only describes capabilities, not host implementation",
  ],
  [
    "所有贡献点通过 <code>contributions</code> 字段声明。插件不能直接创建全局容器，只能请求 runtime 提供的宿主能力。",
    "All contribution points are declared through <code>contributions</code>. Plugins cannot create global containers directly and must request host capabilities from runtime.",
  ],
  ["字段结构", "Field structure"],
  ["完整 manifest 示例", "Full manifest example"],
  [
    "插件通过 runtime context 使用宿主能力",
    "Plugins use host capabilities through runtime context",
  ],
  [
    "每类贡献点的入口组件都收到 <code>runtime</code> prop，提供存储、外部链接、Toast、全局状态等宿主能力。",
    "Each contribution type receives a <code>runtime</code> prop that provides storage, external links, toast, and global host state.",
  ],
  ["Widget 示例", "Widget example"],
  ["Search Provider 示例", "Search Provider example"],
  ["Settings Panel 示例", "Settings Panel example"],
  ["runtime 命名空间", "runtime namespace"],
  ["说明", "Description"],
  ["常用方法", "Common methods"],
  [
    "四类贡献点覆盖工作台全部可见体验",
    "Four contribution types cover the whole visible workbench experience",
  ],
  [
    "每类贡献点都在 manifest 的 contributions 字段声明。宿主在启动时发现并挂载它们。",
    "Each contribution type is declared in the manifest's contributions field. The host discovers and mounts them at startup.",
  ],
  ["贡献点", "Contribution"],
  ["字段名", "Field"],
  ["用途", "Usage"],
  ["尺寸约束", "Size constraints"],
  ["✓ 应当", "✓ Do"],
  ["✗ 不应", "✗ Don't"],
  [
    "每类贡献点只写内容逻辑，不接管外壳。widget 只关心卡片内部 DOM，layout 只关心插槽排布。",
    "Each contribution type should only implement content logic and never take over the shell. A widget only cares about DOM inside the card, while a layout only cares about slot arrangement.",
  ],
  [
    "不要在 widget 内部创建全局 modal 或独立 toast，这些都由 runtime.toast 和宿主提供，避免 z-index 冲突。",
    "Do not create global modals or standalone toasts inside a widget. Those are provided by runtime.toast and the host to avoid z-index conflicts.",
  ],
  ["Refined Sage V2.3 — CSS 自定义属性", "Refined Sage V2.3 — CSS custom properties"],
  [
    "所有组件通过 CSS 变量消费设计令牌，深色模式由 <code>.dark</code> 类自动切换，插件内容区继承宿主令牌，无需额外处理。",
    "All components consume design tokens through CSS variables. Dark mode is switched by the <code>.dark</code> class, and plugin content inherits host tokens without extra work.",
  ],
  ["色彩令牌预览", "Color token preview"],
  ["复制", "Copy"],
]

const normalizeDocsPrototypeBody = (locale: "zh-CN" | "en") => {
  const body = docsPrototypeHtml.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? ""
  const withoutScripts = body.replace(/<script[\s\S]*?<\/script>/g, "")
  const pageBody =
    withoutScripts.match(/<div class="page-body">[\s\S]*<\/div>/)?.[0] ?? withoutScripts

  const normalized = pageBody
    .replace(/href="landing\.html(#.*?)?"/g, (_, hash: string | undefined) => {
      return `href="/${hash ?? ""}"`
    })
    .replace(/href="download\.html(#.*?)?"/g, (_, hash: string | undefined) => {
      return `href="/download${hash ?? ""}"`
    })
    .replace(/href="docs\.html(#.*?)?"/g, (_, hash: string | undefined) => {
      return `href="/docs${hash ?? ""}"`
    })
    .replace(/href="component-spec\.html(#.*?)?"/g, (_, hash: string | undefined) => {
      return `href="/docs/components${hash ?? ""}"`
    })

  if (locale !== "en") return normalized

  return docsEnglishReplacements.reduce((result, [from, to]) => {
    return result.split(from).join(to)
  }, normalized)
}

export function DocsHomePage() {
  const i18n = useSiteI18n()
  const bodyHtml = createMemo(() => normalizeDocsPrototypeBody(i18n.locale()))

  onMount(() => {
    const styleTag = document.createElement("style")
    styleTag.dataset.docsPrototype = "true"
    styleTag.textContent = docsPrototypeCss
    document.head.append(styleTag)

    let resetCopyTimer = 0

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const copyButton = target.closest<HTMLButtonElement>(".copy-btn")
      if (!copyButton) return

      const block =
        copyButton.closest(".code-block") ?? copyButton.closest(".code-head")?.parentElement
      const code = block?.querySelector("code")?.textContent
      if (!code) return

      try {
        await navigator.clipboard?.writeText(code)
        window.clearTimeout(resetCopyTimer)
        copyButton.textContent = i18n.locale() === "en" ? "Copied" : "已复制"
        resetCopyTimer = window.setTimeout(() => {
          copyButton.textContent = i18n.locale() === "en" ? "Copy" : "复制"
        }, 1500)
      } catch {}
    }

    document.addEventListener("click", onClick)

    queueMicrotask(() => {
      document.querySelectorAll("pre > code").forEach((element) => {
        if (!(element instanceof HTMLElement)) return
        if (element.dataset.syntax === "true") return
        element.dataset.syntax = "true"
        element.innerHTML = highlightCode(element.textContent ?? "")
      })
    })

    onCleanup(() => {
      document.removeEventListener("click", onClick)
      window.clearTimeout(resetCopyTimer)
      styleTag.remove()
    })
  })

  return (
    <>
      <PrototypeTopnav active="docs" onThemeToggled={() => {}} />
      <div innerHTML={bodyHtml()} />
    </>
  )
}
