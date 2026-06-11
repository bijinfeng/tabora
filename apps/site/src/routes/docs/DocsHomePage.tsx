import { onCleanup, onMount } from "solid-js"

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

const normalizeDocsPrototypeBody = () => {
  const body = docsPrototypeHtml.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? ""
  const withoutScripts = body.replace(/<script[\s\S]*?<\/script>/g, "")
  const pageBody =
    withoutScripts.match(/<div class="page-body">[\s\S]*<\/div>/)?.[0] ?? withoutScripts

  return pageBody
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
}

export function DocsHomePage() {
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
        copyButton.textContent = "已复制"
        resetCopyTimer = window.setTimeout(() => {
          copyButton.textContent = "复制"
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
      <div innerHTML={normalizeDocsPrototypeBody()} />
    </>
  )
}
