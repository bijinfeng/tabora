import * as stylex from "@stylexjs/stylex"

import { codeTokenStyles } from "./codeHighlight.styles"

type CodeTokenKind = keyof typeof codeTokenStyles

const token = (kind: CodeTokenKind, value: string) => {
  const className = stylex.props(codeTokenStyles[kind]).className ?? ""
  return `<span class="${className}" data-code-token="${kind}">${value}</span>`
}

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
  if (/(^|\n)\s*(pnpm|npm|yarn|bun)\s+/.test(value) || /(^|\n)\s*#/.test(value)) return "bash"
  if (/(^|\n)\s*(import|export|type|interface|const|let|var|function)\b/.test(value)) {
    return "tsx"
  }
  if (trimmed.includes("<") && trimmed.includes(">")) return "html"
  return "plain"
}

const tokenName = (index: number) => {
  let value = ""
  let current = index

  do {
    value = String.fromCharCode(65 + (current % 26)) + value
    current = Math.floor(current / 26) - 1
  } while (current >= 0)

  return value
}

const createTokenStore = () => {
  const tokens: string[] = []

  const makeToken = (html: string) => {
    const key = `@@TBRHL_${tokenName(tokens.length)}@@`
    tokens.push(html)
    return key
  }

  const restoreTokens = (value: string) => {
    return tokens.reduceRight((output, html, index) => {
      return output.replaceAll(`@@TBRHL_${tokenName(index)}@@`, html)
    }, value)
  }

  return { makeToken, restoreTokens }
}

const highlightJson = (value: string) => {
  const escaped = escapeHtml(value)
  const withStrings = escaped.replace(
    /&quot;([^&]|&(?!quot;))*?&quot;/g,
    (match, _content, offset, full) => {
      const after = full.slice(offset + match.length)
      const isKey = /^\s*:/.test(after)
      return token(isKey ? "attr" : "string", match)
    },
  )

  return withStrings
    .replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
      return token("number", match)
    })
    .replace(/\b(true|false|null)\b/g, (match) => {
      return token("keyword", match)
    })
    .replace(/[{}[\],:]/g, (match) => {
      return token("punct", match)
    })
}

const highlightBash = (value: string) => {
  const escaped = escapeHtml(value)
  const withComments = escaped.replace(/(^|\n)\s*#.*$/g, (match) => {
    return token("comment", match)
  })

  const withStrings = withComments.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => {
    return token("string", match)
  })

  return withStrings.replace(/(^|\s)(--?[\w-]+)/g, (_match, space, flag) => {
    return `${space}${token("keyword", flag)}`
  })
}

const highlightJsxTags = (value: string, makeToken: (html: string) => string) => {
  const tagStack: Array<{ braceDepth: number }> = []
  let output = ""
  let index = 0

  while (index < value.length) {
    const tagMatch = value.slice(index).match(/^&lt;\/?[\w.:-]+/)
    if (tagMatch) {
      const before = value.slice(0, index)
      const after = value.slice(index + tagMatch[0].length)
      const isClosingTag = tagMatch[0].startsWith("&lt;/")
      const isJsxOpen =
        (isClosingTag && after.startsWith("&gt;")) ||
        (/(^|[\s([{:>,=])$/.test(before) && /^[\s/>]/.test(after))

      if (isJsxOpen) {
        output += makeToken(`${token("punct", "&lt;")}${token("tag", tagMatch[0].slice(4))}`)
        tagStack.push({ braceDepth: 0 })
        index += tagMatch[0].length
        continue
      }
    }

    const currentTag = tagStack[tagStack.length - 1]

    if (currentTag) {
      if (currentTag.braceDepth === 0 && value.startsWith("/&gt;", index)) {
        output += makeToken(token("punct", "/&gt;"))
        tagStack.pop()
        index += 5
        continue
      }

      if (currentTag.braceDepth === 0 && value.startsWith("&gt;", index)) {
        output += makeToken(token("punct", "&gt;"))
        tagStack.pop()
        index += 4
        continue
      }

      if (currentTag.braceDepth === 0) {
        const attrMatch = value.slice(index).match(/^(\s)([\w:-]+)(?=\s*=)/)
        if (attrMatch) {
          output += `${attrMatch[1]}${token("attr", attrMatch[2] ?? "")}`
          index += attrMatch[0].length
          continue
        }
      }

      if (value[index] === "{") currentTag.braceDepth += 1
      else if (value[index] === "}") currentTag.braceDepth = Math.max(0, currentTag.braceDepth - 1)
    }

    output += value[index]
    index += 1
  }

  return output
}

const highlightTsx = (value: string) => {
  const { makeToken, restoreTokens } = createTokenStore()
  const escaped = escapeHtml(value)
  const withStrings = escaped.replace(
    /`(?:\\[\s\S]|[^`])*`|&quot;(?:\\[\s\S]|(?!&quot;)[\s\S])*?&quot;|&#39;(?:\\[\s\S]|(?!&#39;)[\s\S])*?&#39;/g,
    (match) => {
      return makeToken(token("string", match))
    },
  )
  const withComments = withStrings.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n\r]*/g, (match) => {
    return makeToken(token("comment", match))
  })
  const withJsx = highlightJsxTags(withComments, makeToken)
  const withKeywords = withJsx.replace(
    /(?<![.\w$])\b(import|from|export|default|type|interface|function|return|const|let|var|as|satisfies|if|else|for|while|new|true|false|null|undefined|async|await)\b(?!\s*:)/g,
    (match) => {
      return token("keyword", match)
    },
  )
  const withNumbers = withKeywords.replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
    return token("number", match)
  })

  return restoreTokens(withNumbers)
}

const highlightHtmlCode = (value: string) => {
  const escaped = escapeHtml(value)
  const withComments = escaped.replace(/&lt;!--[\s\S]*?--&gt;/g, (match) => {
    return token("comment", match)
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
        return ` ${token("attr", name)}`
      })
      .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (valueMatch) => {
        return token("string", valueMatch)
      })

    return `${token("punct", "&lt;")}${token("tag", tagHead)}${highlightedRest}${token("punct", "&gt;")}`
  })
}

export const highlightCode = (value: string) => {
  const lang = guessLanguage(value)
  if (lang === "json") return highlightJson(value)
  if (lang === "tsx") return highlightTsx(value)
  if (lang === "html") return highlightHtmlCode(value)
  if (lang === "bash") return highlightBash(value)
  const escaped = escapeHtml(value)
  return escaped
    .replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, (match) => {
      return token("string", match)
    })
    .replace(/\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, (match) => {
      return token("number", match)
    })
}
